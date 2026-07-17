import { prisma } from '../src/config/db.js';

const interviewId = '5265318c-3f24-4f7d-afe0-aec2e9198fea';

async function diagnose() {
  try {
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

    if (!interview) {
      console.log('❌ Interview session not found in database.');
      return;
    }

    console.log('📊 Interview Session details:');
    console.log(`- Status: ${interview.status}`);
    console.log(`- Overall Score: ${interview.overallScore}`);
    console.log(`- Questions Count: ${interview.questions.length}`);
    
    interview.questions.forEach((q, idx) => {
      console.log(`\n[Question ${idx + 1}] (Order: ${q.order})`);
      console.log(`Text: ${q.questionText}`);
      if (q.answer) {
        console.log(`Answer Text: ${q.answer.answerText}`);
        console.log(`Score: ${q.answer.score}`);
      } else {
        console.log('Answer: ❌ UNANSWERED');
      }
    });
  } catch (error) {
    console.error('Error querying database:', error);
  }
}

diagnose();
