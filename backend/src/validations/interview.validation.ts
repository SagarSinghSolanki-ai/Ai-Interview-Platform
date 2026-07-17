import { z } from 'zod';

export const createInterviewSchema = z.object({
  body: z.object({
    role: z.string().trim().min(2, { message: 'Target role/topic must be at least 2 characters long' }).max(50),
    difficulty: z.enum(['entry', 'mid', 'senior'], {
      errorMap: () => ({ message: 'Difficulty must be entry, mid, or senior' }),
    }),
    type: z.enum(['HR', 'Technical', 'Behavioral', 'DSA', 'OOP', 'DBMS', 'OS', 'Networks'], {
      errorMap: () => ({ message: 'Invalid interview type selection' }),
    }),
  }),
});

export const submitAnswerSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Invalid interview ID format' }),
  }),
  body: z.object({
    answerText: z.string().trim().min(5, { message: 'Answer must be at least 5 characters long' }),
  }),
});
