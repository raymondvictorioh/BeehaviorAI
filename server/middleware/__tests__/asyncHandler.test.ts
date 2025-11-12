import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../asyncHandler';

describe('asyncHandler middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    mockReq = {
      params: {},
      body: {},
    };

    mockRes = {
      status: statusMock,
      json: jsonMock,
    };

    mockNext = vi.fn();
  });

  describe('Successful async operations', () => {
    it('should execute async handler successfully', async () => {
      const handler = asyncHandler(async (req: Request, res: Response) => {
        res.json({ success: true });
      });

      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(jsonMock).toHaveBeenCalledWith({ success: true });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should pass request and response objects to handler', async () => {
      const handlerFn = vi.fn(async (req: Request, res: Response) => {
        res.json({ data: req.params });
      });

      const handler = asyncHandler(handlerFn);

      mockReq.params = { id: '123' };
      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(handlerFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
      expect(jsonMock).toHaveBeenCalledWith({ data: { id: '123' } });
    });

    it('should handle async operations that return promises', async () => {
      const handler = asyncHandler(async (req: Request, res: Response) => {
        const result = await Promise.resolve('async result');
        res.json({ result });
      });

      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(jsonMock).toHaveBeenCalledWith({ result: 'async result' });
    });

    it('should allow handler to set response status', async () => {
      const handler = asyncHandler(async (req: Request, res: Response) => {
        res.status(201).json({ created: true });
      });

      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({ created: true });
    });
  });

  describe('Error handling', () => {
    it('should catch async errors and pass to next()', async () => {
      const error = new Error('Async operation failed');
      const handler = asyncHandler(async () => {
        throw error;
      });

      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(jsonMock).not.toHaveBeenCalled();
    });

    it('should catch promise rejections and pass to next()', async () => {
      const error = new Error('Promise rejected');
      const handler = asyncHandler(async () => {
        throw error;
      });

      handler(mockReq as Request, mockRes as Response, mockNext);

      // Wait for next tick to allow promise to reject
      await new Promise(resolve => setImmediate(resolve));

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle errors thrown in async operations', async () => {
      const error = new Error('Database query failed');
      const handler = asyncHandler(async () => {
        await new Promise(resolve => setTimeout(resolve, 1));
        throw error;
      });

      handler(mockReq as Request, mockRes as Response, mockNext);

      // Wait for async operation to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle synchronous errors thrown before await', async () => {
      const error = new Error('Synchronous error');
      const handler = asyncHandler(async () => {
        throw error;
        // await someAsyncOperation(); // Never reached
      });

      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle custom error objects', async () => {
      const customError = {
        code: '23503',
        message: 'Foreign key violation',
      };

      const handler = asyncHandler(async () => {
        throw customError;
      });

      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(customError);
    });
  });

  describe('Integration with Express middleware chain', () => {
    it('should work with next() being passed through', async () => {
      const handler = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        // Simulate calling next middleware
        next();
      });

      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle multiple async operations in sequence', async () => {
      const handler = asyncHandler(async (req: Request, res: Response) => {
        const data1 = await Promise.resolve('first');
        const data2 = await Promise.resolve('second');
        res.json({ data1, data2 });
      });

      await handler(mockReq as Request, mockRes as Response, mockNext);

      // Wait for async operations
      await new Promise(resolve => setImmediate(resolve));

      expect(jsonMock).toHaveBeenCalledWith({
        data1: 'first',
        data2: 'second',
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle handlers that do not send a response', async () => {
      const handler = asyncHandler(async (req: Request, res: Response) => {
        // Do nothing - no response sent
      });

      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(jsonMock).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle handlers that return void', async () => {
      const handler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        res.json({ success: true });
      });

      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(jsonMock).toHaveBeenCalledWith({ success: true });
    });

    it('should handle handlers that return values', async () => {
      const handler = asyncHandler(async (req: Request, res: Response) => {
        res.json({ data: 'test' });
        return 'some value';
      });

      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(jsonMock).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should handle null errors', async () => {
      const handler = asyncHandler(async () => {
        throw null;
      });

      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(null);
    });

    it('should handle undefined errors', async () => {
      const handler = asyncHandler(async () => {
        throw undefined;
      });

      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(undefined);
    });
  });

  describe('Performance and concurrency', () => {
    it('should handle concurrent async operations', async () => {
      const handler = asyncHandler(async (req: Request, res: Response) => {
        const [result1, result2, result3] = await Promise.all([
          Promise.resolve('data1'),
          Promise.resolve('data2'),
          Promise.resolve('data3'),
        ]);

        res.json({ result1, result2, result3 });
      });

      await handler(mockReq as Request, mockRes as Response, mockNext);

      // Wait for async operations
      await new Promise(resolve => setImmediate(resolve));

      expect(jsonMock).toHaveBeenCalledWith({
        result1: 'data1',
        result2: 'data2',
        result3: 'data3',
      });
    });

    it('should catch errors from any promise in Promise.all', async () => {
      const error = new Error('One operation failed');
      const handler = asyncHandler(async () => {
        await Promise.all([
          Promise.resolve('success'),
          Promise.reject(error),
          Promise.resolve('also success'),
        ]);
      });

      handler(mockReq as Request, mockRes as Response, mockNext);

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('Type safety', () => {
    it('should accept RequestHandler function signature', async () => {
      const handler = asyncHandler(async (
        req: Request,
        res: Response,
        next: NextFunction
      ) => {
        res.json({ success: true });
      });

      // Type check: should compile without errors
      expect(typeof handler).toBe('function');
    });

    it('should work with parameterized route handlers', async () => {
      interface CustomRequest extends Request {
        user?: { id: string };
      }

      const handler = asyncHandler(async (req: CustomRequest, res: Response) => {
        res.json({ userId: req.user?.id });
      });

      (mockReq as any).user = { id: '123' };
      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(jsonMock).toHaveBeenCalledWith({ userId: '123' });
    });
  });
});
