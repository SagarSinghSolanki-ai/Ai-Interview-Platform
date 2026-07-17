import { Request, Response } from 'express';
import { CodingService } from '../services/coding.service.js';
import { sendResponse } from '../utils/response.js';
import { catchAsync } from '../utils/catch-async.js';

// Sandbox execution trial (does not persist to DB)
export const run = catchAsync(async (req: Request, res: Response) => {
  const { language, code } = req.body;
  const data = await CodingService.executeCode(language, code);
  return sendResponse(res, 200, 'Code executed sandbox trial completed', data);
});

// Production compilation trial (persists results to DB logs)
export const submit = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { language, code } = req.body;
  
  const data = await CodingService.submitCode(userId, language, code);
  return sendResponse(res, 201, 'Code submitted and logged successfully', data);
});

// Fetch user's previous coding executions
export const list = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const data = await CodingService.listSubmissions(userId);
  return sendResponse(res, 200, 'Coding submissions logs retrieved successfully', data);
});
