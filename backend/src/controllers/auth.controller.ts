import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import { sendResponse } from '../utils/response.js';
import { catchAsync } from '../utils/catch-async.js';

export const register = catchAsync(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  const data = await AuthService.register(name, email, password);
  return sendResponse(res, 201, 'User registration completed successfully', data);
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const data = await AuthService.login(email, password);
  return sendResponse(res, 200, 'Login completed successfully', data);
});

export const refresh = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const data = await AuthService.refresh(refreshToken);
  return sendResponse(res, 200, 'Token refreshed successfully', data);
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  await AuthService.logout(userId);
  return sendResponse(res, 200, 'Logged out successfully');
});

export const me = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const data = await AuthService.me(userId);
  return sendResponse(res, 200, 'Current profile retrieved successfully', data);
});
