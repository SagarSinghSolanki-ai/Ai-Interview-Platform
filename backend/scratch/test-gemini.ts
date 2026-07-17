import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environmental variables
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
console.log('Testing Gemini API with Key starting with:', apiKey ? apiKey.substring(0, 10) + '...' : 'Undefined');

const ai = new GoogleGenAI({ apiKey });

async function runTest() {
  try {
    console.log('Testing generateContent with model: gemini-3.5-flash...');
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: 'Respond with "Gemini API Connection Success" if you receive this.',
    });
    console.log('🎉 SUCCESS! Response:', response.text);
  } catch (error: any) {
    console.error('❌ FAILURE:', error.message || error);
  }
}

runTest();
