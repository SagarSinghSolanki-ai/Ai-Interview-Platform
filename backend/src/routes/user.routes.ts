import { Router } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../config/db.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { catchAsync } from '../utils/catch-async.js';
import { sendResponse } from '../utils/response.js';
import { ApiError } from '../utils/api-error.js';
import { InterviewService } from '../services/interview.service.js';
import { updateProfileSchema, changePasswordSchema } from '../validations/user.validation.js';

const router = Router();

// Apply auth middleware to protect user metrics and configurations
router.use(authenticate);

router.get('/stats', catchAsync(async (req, res) => {
  const userId = req.user!.id;
  const data = await InterviewService.getStats(userId);
  return sendResponse(res, 200, 'User statistics retrieved successfully', data);
}));

// Update User display profile name
router.put('/profile', validate(updateProfileSchema), catchAsync(async (req, res) => {
  const userId = req.user!.id;
  const { name } = req.body;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { name },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });

  return sendResponse(res, 200, 'Profile updated successfully', updatedUser);
}));

// Change User password verification
router.put('/change-password', validate(changePasswordSchema), catchAsync(async (req, res) => {
  const userId = req.user!.id;
  const { oldPassword, newPassword } = req.body;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(404, 'User profile not found');
  }

  // Compare old password with stored hash
  const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!isMatch) {
    throw new ApiError(400, 'Incorrect current password');
  }

  // Hash new password and invalidate active refresh tokens
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      refreshToken: null, // Clear token log to force re-authentication
    },
  });

  return sendResponse(res, 200, 'Password updated successfully');
}));

export default router;
