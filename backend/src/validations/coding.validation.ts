import { z } from 'zod';

export const codingSchema = z.object({
  body: z.object({
    language: z.enum(['javascript', 'python', 'cpp', 'java'], {
      errorMap: () => ({ message: 'Invalid language selection' }),
    }),
    code: z.string().min(1, { message: 'Source code content cannot be empty' }),
  }),
});
