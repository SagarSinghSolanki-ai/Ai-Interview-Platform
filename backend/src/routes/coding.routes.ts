import { Router } from 'express';
import * as CodingController from '../controllers/coding.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { codingSchema } from '../validations/coding.validation.js';

const router = Router();

// Apply auth middleware to protect sandbox workspace
router.use(authenticate);

router.post('/run', validate(codingSchema), CodingController.run);
router.post('/submit', validate(codingSchema), CodingController.submit);
router.get('/history', CodingController.list);

export default router;
