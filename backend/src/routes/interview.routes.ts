import { Router } from 'express';
import * as InterviewController from '../controllers/interview.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { createInterviewSchema, submitAnswerSchema } from '../validations/interview.validation.js';

const router = Router();

// Apply auth middleware to protect all interview operations
router.use(authenticate);

router.post('/', validate(createInterviewSchema), InterviewController.create);
router.post('/:id/answer', validate(submitAnswerSchema), InterviewController.submitAnswer);
router.get('/', InterviewController.list);
router.get('/:id', InterviewController.getDetail);
router.delete('/:id', InterviewController.remove);

export default router;
