import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

/**
 * Centralized error handling middleware for Express routes
 *
 * Handles different types of errors and returns appropriate HTTP status codes:
 * - 400: Validation errors (Zod), database constraint violations
 * - 404: Not found errors
 * - 500: Generic server errors
 *
 * @param err - The error object (can be Error, ZodError, database error, etc.)
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function (not used, but required for error middleware signature)
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log all errors for debugging
  console.error('API Error:', err);

  // Handle null/undefined errors
  if (!err) {
    res.status(500).json({ message: 'Internal server error' });
    return;
  }

  // 1. Handle Zod validation errors (400)
  if (err instanceof ZodError || err.name === 'ZodError') {
    res.status(400).json({
      message: 'Validation error',
      errors: err.errors,
    });
    return;
  }

  // 2. Handle database constraint errors (400)
  if (err.code) {
    switch (err.code) {
      case '23503': // Foreign key violation
        res.status(400).json({
          message: 'Invalid reference. The related record does not exist.',
        });
        return;

      case '23505': // Unique constraint violation
        res.status(400).json({
          message: 'Duplicate entry. This record already exists.',
        });
        return;

      case '23502': // Not null constraint violation
        res.status(400).json({
          message: 'Missing required field.',
        });
        return;
    }
  }

  // 3. Handle "not found" errors (404)
  const errorMessage = typeof err === 'string' ? err : err.message || '';
  if (
    errorMessage.toLowerCase().includes('not found') ||
    errorMessage.toLowerCase().includes('does not exist')
  ) {
    res.status(404).json({
      message: errorMessage || 'Resource not found',
    });
    return;
  }

  // 4. Handle generic errors (500)
  res.status(500).json({
    message: errorMessage || 'Internal server error',
  });
}
