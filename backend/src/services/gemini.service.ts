import { ai, GEMINI_MODEL } from '../config/gemini.js';
import { ApiError } from '../utils/api-error.js';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export class GeminiService {
  // Generate the first interview question dynamically
  public static async generateFirstQuestion(role: string, difficulty: string, type: string): Promise<string> {
    const prompt = `You are an expert interviewer. Generate the first warm-up interview question for a candidate interviewing for a ${difficulty}-level "${role}" position. 
The interview focus is: "${type}".
Keep the question professional, clear, and relevant. It should be a conceptual or high-level architecture question to start. Start the interview directly with the question. Do not include introductory text or pleasantries.`;

    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
      });

      return response.text?.trim() || 'Welcome. Can you describe your experience and why you are interested in this position?';
    } catch (error) {
      console.error('Error generating first question from Gemini:', error);
      throw new ApiError(502, 'Failed to communicate with Gemini AI to generate the question');
    }
  }

  // Generate the next primary question based on previous Q&A history
  public static async generateNextPrimaryQuestion(
    role: string,
    difficulty: string,
    type: string,
    history: ChatMessage[]
  ): Promise<string> {
    const historyText = history.map((msg) => `${msg.role === 'user' ? 'Candidate' : 'Interviewer'}: ${msg.text}`).join('\n');
    
    const prompt = `You are an expert interviewer conducting a ${difficulty}-level "${role}" mock interview. The topic is "${type}".
Review the previous Q&A transcript:
${historyText}

Generate the next distinct primary interview question. 
Rules:
1. Do NOT repeat or duplicate topics already covered in the transcript.
2. Mix of Question Types: An interview must have a balance of both:
   - Conceptual/Verbal questions (evaluating architectural patterns, design, security, state management, or debugging).
   - Practical Coding/Algorithmic challenges (explicitly prompting the candidate to write, implement, or develop a specific function, class, or algorithm).
   - IMPORTANT: If this is a coding question, you MUST explicitly instruct the candidate to write their solution in the integrated code editor. (e.g., "Please implement a function to... in the code editor on your right.")
3. Advance the conversation logically (explore new areas like concurrency, scalability, or behavior fit depending on the topic).
4. Be CONVERSATIONAL and REALISTIC: Acknowledge the candidate's last message first! 
   - If they said "I don't know", asked for an explanation, or left it blank, briefly explain the answer or concept (1-2 sentences) first, then transition to the next question (e.g. "No problem. The basic idea of indexes is... Let's move to our next question:").
   - If they answered, briefly validate it (e.g. "Good points about database indexes. Let's move on to...") and then ask the next question.
   - If they said something off-topic or gave an attitude, respond professionally, then steer the conversation back.
5. Keep the transition and the question in a single fluid paragraph response.`;

    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
      });

      return response.text?.trim() || 'What is your approach to handling complex debugging tasks under tight timelines?';
    } catch (error) {
      console.error('Error generating next question from Gemini:', error);
      throw new ApiError(502, 'Failed to communicate with Gemini AI to generate the next question');
    }
  }

  // Evaluate a candidate's answer and decide if a follow-up is needed
  public static async evaluateAnswer(
    role: string,
    difficulty: string,
    type: string,
    question: string,
    answer: string,
    history: ChatMessage[]
  ) {
    const historyText = history.map((msg) => `${msg.role === 'user' ? 'Candidate' : 'Interviewer'}: ${msg.text}`).join('\n');
    
    const prompt = `You are an expert technical interviewer evaluating a candidate's answer.
Context:
- Target Job: ${difficulty}-level "${role}"
- Interview Topic: "${type}"
- Question Asked: "${question}"
- Candidate's Answer: "${answer}"
 
Review the full transcript for context:
${historyText}

Evaluate the candidate's answer and provide:
1. An overall score (0-100), technical depth score (0-100), and communication presentation score (0-100).
2. Constructive critique feedback text.
3. Determine if you should follow up on this answer (shouldFollowUp = true). Set to true only if the candidate's answer was vague, incomplete, or introduced a topic that warrants immediate exploration.
4. If shouldFollowUp is true, generate the follow-up question.
   - Be CONVERSATIONAL: Acknowledge what they said (e.g. "I see you mentioned thread-safety, but how exactly would you prevent a deadlock in that scenario?") rather than just asking a cold, isolated question.
   - If false, leave followUpQuestion empty.`;

    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              score: { type: 'NUMBER', description: 'Overall score from 0 to 100 representing the answer quality' },
              technicalScore: { type: 'NUMBER', description: 'Score from 0 to 100 evaluating technical depth and accuracy' },
              communicationScore: { type: 'NUMBER', description: 'Score from 0 to 100 evaluating presentation structure and clarity' },
              feedbackText: { type: 'STRING', description: 'Detailed constructive critique of the user answer' },
              shouldFollowUp: { type: 'BOOLEAN', description: 'Set to true if the answer is vague or deserves a detailed follow-up question' },
              followUpQuestion: { type: 'STRING', description: 'The follow-up question text if shouldFollowUp is true, otherwise empty' },
            },
            required: ['score', 'technicalScore', 'communicationScore', 'feedbackText', 'shouldFollowUp', 'followUpQuestion'],
          },
        },
      });

      const jsonText = response.text || '{}';
      return JSON.parse(jsonText);
    } catch (error) {
      console.error('Error evaluating answer from Gemini:', error);
      throw new ApiError(502, 'Failed to communicate with Gemini AI to evaluate the answer');
    }
  }

  // Compile final results report based on entire interview transcript
  public static async generateFinalReport(
    role: string,
    difficulty: string,
    type: string,
    history: ChatMessage[]
  ) {
    const historyText = history.map((msg) => `${msg.role === 'user' ? 'Candidate' : 'Interviewer'}: ${msg.text}`).join('\n');

    const prompt = `You are a Senior Principal Engineer reviewing a completed mock interview transcript.
Context:
- Target Job: ${difficulty}-level "${role}"
- Interview Topic: "${type}"

Complete Transcript:
${historyText}

Analyze the entire interview session and compile:
1. Overall, Technical, and Communication aggregate scores (0-100).
2. A comprehensive feedback summary in markdown layout.
3. An array of 3 key Strengths identified.
4. An array of 3 key Weaknesses identified.
5. An array of 3 actionable Suggestions/Tips for optimization.`;

    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              overallScore: { type: 'NUMBER', description: 'Aggregate overall score from 0 to 100' },
              technicalScore: { type: 'NUMBER', description: 'Aggregate technical score from 0 to 100' },
              communicationScore: { type: 'NUMBER', description: 'Aggregate communication score from 0 to 100' },
              feedback: { type: 'STRING', description: 'Summary critique markdown text evaluating overall performance' },
              strengths: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Exactly 3 key strengths' },
              weaknesses: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Exactly 3 key weaknesses/improvement areas' },
              suggestions: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Exactly 3 actionable suggestions' },
            },
            required: ['overallScore', 'technicalScore', 'communicationScore', 'feedback', 'strengths', 'weaknesses', 'suggestions'],
          },
        },
      });

      const jsonText = response.text || '{}';
      return JSON.parse(jsonText);
    } catch (error) {
      console.error('Error generating final report from Gemini:', error);
      throw new ApiError(502, 'Failed to communicate with Gemini AI to compile the final feedback report');
    }
  }
}
