import { Router } from 'express';
import * as AuthController from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { registerSchema, loginSchema, refreshSchema } from '../validations/auth.validation.js';

const router = Router();

// Public auth endpoints (require input schema validation)
router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/refresh', validate(refreshSchema), AuthController.refresh);

// Protected auth endpoints (require valid JWT access token)
router.post('/logout', authenticate, AuthController.logout);
router.get('/me', authenticate, AuthController.me);

export default router;
