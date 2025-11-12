import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps async route handlers to catch errors and pass them to Express error middleware
 *
 * This eliminates the need for try-catch blocks in every async route handler.
 * Any errors thrown in the async function (or rejected promises) are automatically
 * caught and passed to the next() middleware (error handler).
 *
 * @param fn - Async route handler function
 * @returns Express RequestHandler that catches async errors
 *
 * @example
 * app.get('/users/:id', asyncHandler(async (req, res) => {
 *   const user = await db.getUser(req.params.id);
 *   res.json(user);
 * }));
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    // Wrap the async function in Promise.resolve to handle both:
    // 1. Functions that return promises
    // 2. Functions that throw synchronously before any await
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
