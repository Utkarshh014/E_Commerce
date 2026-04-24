import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

// ─── Centralized Error Handler ──────────────────────────────────────
// All errors flow through this middleware for consistent API responses.

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
    return;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      message: 'Invalid ID format',
    });
    return;
  }

  // Mongoose duplicate key error
  if ((err as unknown as Record<string, unknown>).code === 11000) {
    res.status(409).json({
      success: false,
      message: 'Duplicate value error',
    });
    return;
  }

  // Generic error
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};