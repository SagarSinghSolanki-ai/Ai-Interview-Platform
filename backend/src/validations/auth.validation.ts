import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().trim().email({ message: 'Invalid email format' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
    name: z.string().trim().min(2, { message: 'Name must be at least 2 characters long' }),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email({ message: 'Invalid email format' }),
    password: z.string().min(1, { message: 'Password is required' }),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, { message: 'Refresh token is required' }),
  }),
});
