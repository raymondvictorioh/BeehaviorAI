import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodSchema } from 'zod';

/**
 * Configuration options for creating a route handler
 */
export interface RouteHandlerConfig {
  /**
   * Storage function to execute
   * Receives extracted parameters and data from the request
   */
  storage: (params: RouteParams) => Promise<any>;

  /**
   * Optional Zod schema for request body validation
   * Validation occurs before calling the storage function
   */
  schema?: ZodSchema;

  /**
   * Optional function to inject additional data into request body
   * Useful for adding organizationId, studentId, etc. from route params
   * Executed before schema validation
   */
  dataInjection?: (req: Request) => Record<string, any>;

  /**
   * Optional custom error message
   * Currently unused but kept for future extensibility
   */
  errorMessage?: string;
}

/**
 * Parameters passed to the storage function
 */
export interface RouteParams {
  /** Organization ID from route params */
  orgId?: string;
  /** Resource ID from route params */
  id?: string;
  /** Student ID from route params */
  studentId?: string;
  /** User ID from session */
  userId?: string;
  /** Request body (validated if schema provided) */
  data?: any;
  /** All other params from the request */
  [key: string]: any;
}

/**
 * Helper function to get userId from request session
 */
function getUserId(req: any): string | undefined {
  return req.session?.supabaseUserId;
}

/**
 * Route handler factory that eliminates boilerplate in route definitions
 *
 * This factory handles:
 * - Parameter extraction (orgId, id, studentId, userId)
 * - Data injection into request body
 * - Schema validation
 * - Error forwarding to error handler middleware
 * - Consistent response formatting
 *
 * @param config - Route handler configuration
 * @returns Express RequestHandler
 *
 * @example
 * // Simple GET route
 * app.get('/api/organizations/:orgId/students',
 *   isAuthenticated,
 *   checkOrganizationAccess,
 *   createHandler({
 *     storage: ({ orgId }) => storage.getStudents(orgId)
 *   })
 * );
 *
 * @example
 * // POST route with validation and data injection
 * app.post('/api/organizations/:orgId/students',
 *   isAuthenticated,
 *   checkOrganizationAccess,
 *   createHandler({
 *     storage: ({ data }) => storage.createStudent(data),
 *     schema: insertStudentSchema,
 *     dataInjection: (req) => ({ organizationId: req.params.orgId })
 *   })
 * );
 */
export function createHandler(config: RouteHandlerConfig): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 1. Extract common parameters from request
      const { orgId, id, studentId, ...otherParams } = req.params;
      const userId = getUserId(req);

      // 2. Prepare data from request body
      let data = req.body;

      // 3. Inject additional data if specified (e.g., organizationId)
      if (config.dataInjection) {
        data = {
          ...data,
          ...config.dataInjection(req),
        };
      }

      // 4. Validate data with schema if provided
      if (config.schema) {
        data = config.schema.parse(data);
      }

      // 5. Build params object for storage function
      const params: RouteParams = {
        orgId,
        id,
        studentId,
        userId,
        data,
        ...otherParams,
      };

      // 6. Call storage function
      const result = await config.storage(params);

      // 7. Send JSON response
      res.json(result);
    } catch (error) {
      // Pass any errors to error handler middleware
      next(error);
    }
  };
}
