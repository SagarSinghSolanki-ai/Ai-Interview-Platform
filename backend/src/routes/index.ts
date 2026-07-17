import { Router } from 'express';
import authRoutes from './auth.routes.js';
import interviewRoutes from './interview.routes.js';
import userRoutes from './user.routes.js';
import codingRoutes from './coding.routes.js';

const router = Router();

// Mount auth endpoints under the '/auth' namespace
router.use('/auth', authRoutes);

// Mount interview endpoints under the '/interviews' namespace
router.use('/interviews', interviewRoutes);

// Mount user endpoints under the '/users' namespace
router.use('/users', userRoutes);

// Mount coding endpoints under the '/coding' namespace
router.use('/coding', codingRoutes);

export default router;
