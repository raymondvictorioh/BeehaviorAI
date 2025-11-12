import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { errorHandler } from '../errorHandler';

describe('errorHandler middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset mocks before each test
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    mockReq = {};
    mockRes = {
      status: statusMock,
      json: jsonMock,
    };
    mockNext = vi.fn();

    // Mock console.error to avoid cluttering test output
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('Zod validation errors', () => {
    it('should return 400 with formatted errors for ZodError', () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18),
      });

      let zodError: Error;
      try {
        schema.parse({ email: 'invalid', age: 10 });
      } catch (error) {
        zodError = error as Error;
      }

      errorHandler(zodError!, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Validation error',
          errors: expect.any(Array),
        })
      );
    });

    it('should include detailed error information in Zod validation errors', () => {
      const schema = z.object({
        name: z.string().min(3),
      });

      let zodError: Error;
      try {
        schema.parse({ name: 'ab' });
      } catch (error) {
        zodError = error as Error;
      }

      errorHandler(zodError!, mockReq as Request, mockRes as Response, mockNext);

      const callArgs = jsonMock.mock.calls[0][0];
      expect(callArgs.errors).toBeDefined();
      expect(callArgs.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Database constraint errors', () => {
    it('should return 400 for foreign key constraint violation (23503)', () => {
      const error: any = new Error('Foreign key violation');
      error.code = '23503';

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Invalid reference. The related record does not exist.',
      });
    });

    it('should return 400 for unique constraint violation (23505)', () => {
      const error: any = new Error('Unique violation');
      error.code = '23505';

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Duplicate entry. This record already exists.',
      });
    });

    it('should return 400 for not-null constraint violation (23502)', () => {
      const error: any = new Error('Not null violation');
      error.code = '23502';

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Missing required field.',
      });
    });

    it('should handle constraint errors with constraint name', () => {
      const error: any = new Error('Constraint violation');
      error.code = '23505';
      error.constraint = 'unique_email_per_org';

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Duplicate entry. This record already exists.',
      });
    });
  });

  describe('Not found errors', () => {
    it('should return 404 for "not found" errors', () => {
      const error = new Error('Student not found');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Student not found',
      });
    });

    it('should return 404 for errors containing "does not exist"', () => {
      const error = new Error('The requested resource does not exist');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'The requested resource does not exist',
      });
    });

    it('should be case-insensitive for not found detection', () => {
      const error = new Error('Record Not Found');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(404);
    });
  });

  describe('Generic errors', () => {
    it('should return 500 for generic errors with message', () => {
      const error = new Error('Database connection failed');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Database connection failed',
      });
    });

    it('should return 500 with default message for errors without message', () => {
      const error = new Error();

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Internal server error',
      });
    });

    it('should handle non-Error objects', () => {
      const error: any = { message: 'Something went wrong' };

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Something went wrong',
      });
    });

    it('should handle string errors', () => {
      const error: any = 'String error message';

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'String error message',
      });
    });
  });

  describe('Error logging', () => {
    it('should log error details to console', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');
      const error = new Error('Test error');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(consoleErrorSpy).toHaveBeenCalledWith('API Error:', error);
    });

    it('should log Zod validation errors', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');
      const schema = z.object({ name: z.string() });

      let zodError: Error;
      try {
        schema.parse({ name: 123 });
      } catch (error) {
        zodError = error as Error;
      }

      errorHandler(zodError!, mockReq as Request, mockRes as Response, mockNext);

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle null error', () => {
      errorHandler(null as any, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Internal server error',
      });
    });

    it('should handle undefined error', () => {
      errorHandler(undefined as any, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Internal server error',
      });
    });

    it('should prioritize Zod error detection over other error types', () => {
      const schema = z.object({ name: z.string() });

      let zodError: any;
      try {
        schema.parse({ name: 123 });
      } catch (error) {
        zodError = error;
      }

      // Add a database error code to test priority
      zodError.code = '23503';

      errorHandler(zodError, mockReq as Request, mockRes as Response, mockNext);

      // Should still be treated as Zod error (400) not database error
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Validation error',
        })
      );
    });

    it('should not call next() as it terminates the middleware chain', () => {
      const error = new Error('Test error');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Response format consistency', () => {
    it('should always return JSON responses', () => {
      const testCases = [
        new Error('Generic error'),
        { code: '23503' } as any,
        { name: 'ZodError', errors: [] } as any,
      ];

      testCases.forEach((error) => {
        vi.clearAllMocks();
        errorHandler(error, mockReq as Request, mockRes as Response, mockNext);
        expect(jsonMock).toHaveBeenCalled();
      });
    });

    it('should always include a message property', () => {
      const testCases = [
        new Error('Test'),
        { code: '23503' } as any,
        'String error' as any,
      ];

      testCases.forEach((error) => {
        vi.clearAllMocks();
        errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

        const response = jsonMock.mock.calls[0][0];
        expect(response).toHaveProperty('message');
        expect(typeof response.message).toBe('string');
      });
    });
  });
});
