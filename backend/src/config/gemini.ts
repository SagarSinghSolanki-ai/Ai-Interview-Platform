import { GoogleGenAI } from '@google/genai';
import { env } from './env.js';

// Instantiate the official Google Gen AI SDK client
export const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

// Highly performant, fast response model for interactive conversational loops
export const GEMINI_MODEL = 'gemini-3.5-flash';
