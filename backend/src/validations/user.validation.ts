import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, { message: 'Name must be at least 2 characters long' }).max(50),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    oldPassword: z.string().min(1, { message: 'Current password is required' }),
    newPassword: z.string().min(6, { message: 'New password must be at least 6 characters long' }),
  }),
});
