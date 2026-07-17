import { ErrorRequestHandler, Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error.js';
import { env } from '../config/env.js';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export const errorHandler: ErrorRequestHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: any = undefined;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    errors = err.format();
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Handling Prisma unique constraint or foreign key violations
    if (err.code === 'P2002') {
      statusCode = 400;
      const fields = (err.meta?.target as string[])?.join(', ') || 'fields';
      message = `Duplicate field error: A record with this value for ${fields} already exists.`;
    } else if (err.code === 'P2003') {
      statusCode = 400;
      message = 'Reference integrity constraint error: Foreign key does not exist.';
    } else if (err.code === 'P2025') {
      statusCode = 404;
      message = err.meta?.cause as string || 'Resource not found in database.';
    } else {
      statusCode = 500;
      message = `Database query exception code: ${err.code}`;
    }
  }

  // Log internal server errors (500s) to console for logging tracking
  if (statusCode === 500) {
    console.error('💥 Internal Server Error:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
