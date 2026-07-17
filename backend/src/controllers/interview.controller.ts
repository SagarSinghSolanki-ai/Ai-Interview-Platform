import { Request, Response } from 'express';
import { InterviewService } from '../services/interview.service.js';
import { sendResponse } from '../utils/response.js';
import { catchAsync } from '../utils/catch-async.js';

export const create = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { role, difficulty, type } = req.body;
  
  const data = await InterviewService.create(userId, role, difficulty, type);
  return sendResponse(res, 201, 'Interview session initialized successfully', data);
});

export const list = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  
  const data = await InterviewService.listByUser(userId, page, limit);
  return sendResponse(res, 200, 'Interviews list retrieved successfully', data);
});

export const getDetail = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  
  const data = await InterviewService.getById(userId, id);
  return sendResponse(res, 200, 'Interview session details retrieved successfully', data);
});

export const submitAnswer = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const interviewId = req.params.id;
  const { answerText } = req.body;

  const data = await InterviewService.submitAnswer(userId, interviewId, answerText);
  return sendResponse(res, 200, 'Answer submitted and evaluated successfully', data);
});

export const remove = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const interviewId = req.params.id;

  await InterviewService.delete(userId, interviewId);
  return sendResponse(res, 200, 'Interview session deleted successfully');
});
