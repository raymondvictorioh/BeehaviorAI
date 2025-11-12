import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Validation middleware factory that validates request body against a Zod schema
 *
 * This middleware:
 * - Validates req.body against the provided Zod schema
 * - Replaces req.body with the validated (and potentially transformed) data
 * - Passes validation errors to the next() error handler
 *
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 *
 * @example
 * app.post('/users',
 *   validate(insertUserSchema),
 *   async (req, res) => {
 *     // req.body is now validated and typed
 *     const user = await createUser(req.body);
 *     res.json(user);
 *   }
 * );
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Parse and validate the request body
      // If successful, this will also transform the data according to the schema
      req.body = schema.parse(req.body);

      // Validation passed, continue to next middleware
      next();
    } catch (error) {
      // Validation failed, pass error to error handler middleware
      next(error);
    }
  };
}
