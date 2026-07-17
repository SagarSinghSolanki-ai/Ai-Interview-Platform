import express from 'express';
import cors from 'cors';
import { loggerMiddleware } from './middlewares/logger.middleware.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { ApiError } from './utils/api-error.js';
import router from './routes/index.js';

const app = express();

// Enable Cross-Origin Resource Sharing
app.use(cors());

// Parse incoming HTTP request payloads
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global custom logging middleware
app.use(loggerMiddleware);

// Server status endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'UP',
    timestamp: new Date().toISOString(),
  });
});

// Mount core API endpoints
app.use('/api', router);

// Capture non-existent API requests
app.use((req, res, next) => {
  next(new ApiError(404, `Route ${req.originalUrl} not found`));
});

// Global application error middleware handler
app.use(errorHandler);

export default app;
