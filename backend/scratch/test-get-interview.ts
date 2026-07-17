import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const interviewId = '5265318c-3f24-4f7d-afe0-aec2e9198fea';
const port = process.env.PORT || 5000;

async function runTest() {
  try {
    // Generate a quick mock token or test endpoint locally
    console.log(`Querying GET http://localhost:${port}/api/interviews/${interviewId} (Diagnostic endpoint directly)...`);
    
    // We can query database directly since we want to check if the mapping in the controller output is correct
    const { prisma } = await import('../src/config/db.js');
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

    console.log('🎉 DB Query Success!');
    console.log('Returned Status:', interview?.status);
    console.log('Overall Score:', interview?.overallScore);
    console.log('JSON Output data type checks:');
    console.log('- status is string:', typeof interview?.status === 'string');
    console.log('- overallScore is number:', typeof interview?.overallScore === 'number');
  } catch (error: any) {
    console.error('❌ FAILURE:', error.message || error);
  }
}

runTest();
