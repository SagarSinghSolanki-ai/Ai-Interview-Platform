import { prisma } from '../config/db.js';
import { ApiError } from '../utils/api-error.js';
import { GeminiService } from './gemini.service.js';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export class InterviewService {
  // Create interview session and generate dynamic first question via Gemini
  public static async create(userId: string, role: string, difficulty: string, type: string) {
    const interview = await prisma.interview.create({
      data: {
        userId,
        role,
        difficulty,
        type,
        status: 'ACTIVE',
      },
    });

    // Generate dynamic starting question using Gemini AI service
    const questionText = await GeminiService.generateFirstQuestion(role, difficulty, type);

    const firstQuestion = await prisma.question.create({
      data: {
        interviewId: interview.id,
        questionText,
        order: 1,
      },
    });

    return {
      interviewId: interview.id,
      firstQuestion: {
        id: firstQuestion.id,
        questionText: firstQuestion.questionText,
        order: firstQuestion.order,
      },
    };
  }

  // Submit user's response, evaluate it, and decide next action (follow-up Q vs primary Q vs completion)
  public static async submitAnswer(userId: string, interviewId: string, answerText: string) {
    // 1. Retrieve the interview and ensure it belongs to user and is ACTIVE
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        questions: {
          include: { answer: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!interview || interview.userId !== userId) {
      throw new ApiError(404, 'Interview session not found');
    }

    if (interview.status === 'COMPLETED') {
      throw new ApiError(400, 'This interview session has already been completed');
    }

    // 2. Locate the current question (the last question in chronological order which has no answer yet)
    const currentQuestion = interview.questions.find((q) => !q.answer);

    if (!currentQuestion) {
      throw new ApiError(400, 'No active question waiting for response');
    }

    // 3. Create the Answer record
    const createdAnswer = await prisma.answer.create({
      data: {
        questionId: currentQuestion.id,
        answerText,
      },
    });

    // 4. Compile the full conversation history (Q&As) so far to feed context to Gemini
    const history: ChatMessage[] = [];
    interview.questions.forEach((q) => {
      // Add model question
      history.push({ role: 'model', text: q.questionText });
      if (q.id === currentQuestion.id) {
        // Add current user answer
        history.push({ role: 'user', text: answerText });
      } else if (q.answer) {
        // Add historical user answer
        history.push({ role: 'user', text: q.answer.answerText });
      }
    });

    // 5. Invoke Gemini to evaluate the submitted answer
    const evaluation = await GeminiService.evaluateAnswer(
      interview.role,
      interview.difficulty,
      interview.type,
      currentQuestion.questionText,
      answerText,
      history.slice(0, -1) // Exclude current answer from history input to prevent duplication in prompt
    );

    // 6. Update the Answer record in the database with scores and feedback
    await prisma.answer.update({
      where: { id: createdAnswer.id },
      data: {
        score: evaluation.score,
        technicalScore: evaluation.technicalScore,
        communicationScore: evaluation.communicationScore,
        feedbackText: evaluation.feedbackText,
      },
    });

    // 7. Check if we have completed our question limit (e.g. 5 questions overall)
    const totalQuestionsAsked = interview.questions.length;
    const MAX_QUESTIONS = 5;

    if (totalQuestionsAsked >= MAX_QUESTIONS) {
      // Close the interview: generate final report
      const fullHistoryForReport: ChatMessage[] = [...history];
      
      const finalReport = await GeminiService.generateFinalReport(
        interview.role,
        interview.difficulty,
        interview.type,
        fullHistoryForReport
      );

      // Save aggregate scores and finalize status
      const updatedInterview = await prisma.interview.update({
        where: { id: interview.id },
        data: {
          status: 'COMPLETED',
          overallScore: finalReport.overallScore,
          technicalScore: finalReport.technicalScore,
          communicationScore: finalReport.communicationScore,
          feedback: finalReport.feedback,
          strengths: finalReport.strengths,
          weaknesses: finalReport.weaknesses,
          suggestions: finalReport.suggestions,
        },
      });

      return {
        isFinished: true,
        interview: updatedInterview,
      };
    }

    // 8. Otherwise, we are under the limit: generate next question
    let nextQuestionText = '';

    if (evaluation.shouldFollowUp && evaluation.followUpQuestion) {
      // Candidate's answer was incomplete or vague: ask follow-up question
      nextQuestionText = evaluation.followUpQuestion;
    } else {
      // Candidates answer was solid: generate new primary question on a different topic
      nextQuestionText = await GeminiService.generateNextPrimaryQuestion(
        interview.role,
        interview.difficulty,
        interview.type,
        history
      );
    }

    // Save the new question to the database
    const nextQuestion = await prisma.question.create({
      data: {
        interviewId: interview.id,
        questionText: nextQuestionText,
        order: totalQuestionsAsked + 1,
      },
    });

    return {
      isFinished: false,
      nextQuestion: {
        id: nextQuestion.id,
        questionText: nextQuestion.questionText,
        order: nextQuestion.order,
      },
    };
  }

  // Fetch paginated list of interviews started by user
  public static async listByUser(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [interviews, total] = await Promise.all([
      prisma.interview.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.interview.count({
        where: { userId },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      interviews,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  // Fetch interview details with questions and answers history
  public static async getById(userId: string, interviewId: string) {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        questions: {
          include: {
            answer: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!interview || interview.userId !== userId) {
      throw new ApiError(404, 'Interview session not found or access denied');
    }

    return interview;
  }

  // Calculate aggregate stats for dashboard displays
  public static async getStats(userId: string) {
    const interviews = await prisma.interview.findMany({
      where: { userId },
      select: {
        overallScore: true,
        status: true,
      },
    });

    const total = interviews.length;
    const completed = interviews.filter((i) => i.status === 'COMPLETED').length;
    const graded = interviews.filter((i) => i.overallScore !== null);
    const averageScore =
      graded.length > 0
        ? graded.reduce((sum, i) => sum + (i.overallScore || 0), 0) / graded.length
        : 0;

    return {
      totalInterviews: total,
      completedInterviews: completed,
      averageScore,
    };
  }

  // Delete interview session and cascaded records
  public static async delete(userId: string, interviewId: string): Promise<void> {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
    });

    if (!interview || interview.userId !== userId) {
      throw new ApiError(404, 'Interview session not found or access denied');
    }

    await prisma.interview.delete({
      where: { id: interviewId },
    });
  }
}
