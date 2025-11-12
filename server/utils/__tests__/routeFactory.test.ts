import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { createHandler } from '../routeFactory';

describe('routeFactory', () => {
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
      session: { supabaseUserId: 'user-123' } as any,
    };

    mockRes = {
      status: statusMock,
      json: jsonMock,
    };

    mockNext = vi.fn();
  });

  describe('Basic handler creation', () => {
    it('should create a handler that calls storage method', async () => {
      const storageFn = vi.fn().mockResolvedValue({ id: '1', name: 'Test' });

      const handler = createHandler({
        storage: storageFn,
      });

      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(storageFn).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({ id: '1', name: 'Test' });
    });

    it('should extract orgId from params', async () => {
      mockReq.params = { orgId: 'org-456' };

      const storageFn = vi.fn().mockResolvedValue([]);

      const handler = createHandler({
        storage: storageFn,
      });

      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(storageFn).toHaveBeenCalledWith(
        expect.objectContaining({ orgId: 'org-456' })
      );
    });

    it('should extract multiple params (orgId, id, studentId)', async () => {
      mockReq.params = {
        orgId: 'org-123',
        id: 'resource-456',
        studentId: 'student-789',
      };

      const storageFn = vi.fn().mockResolvedValue({});

      const handler = createHandler({
        storage: storageFn,
      });

      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(storageFn).toHaveBeenCalledWith(
        expect.objectContaining({
          orgId: 'org-123',
          id: 'resource-456',
          studentId: 'student-789',
        })
      );
    });

    it('should extract userId from session', async () => {
      const storageFn = vi.fn().mockResolvedValue({});

      const handler = createHandler({
        storage: storageFn,
      });

      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(storageFn).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-123' })
      );
    });
  });

  describe('Data injection', () => {
    it('should inject organizationId into request body', async () => {
      mockReq.params = { orgId: 'org-123' };
      mockReq.body = { name: 'Test Student' };

      const storageFn = vi.fn().mockResolvedValue({ id: '1' });

      const handler = createHandler({
        storage: storageFn,
        dataInjection: (req) => ({ organizationId: req.params.orgId }),
      });

      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(storageFn).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Test Student',
            organizationId: 'org-123',
          }),
        })
      );
    });

    it('should inject multiple fields into request body', async () => {
      mockReq.params = { orgId: 'org-123', studentId: 'student-456' };
      mockReq.body = { title: 'Resource' };

      const storageFn = vi.fn().mockResolvedValue({ id: '1' });

      const handler = createHandler({
        storage: storageFn,
        dataInjection: (req) => ({
          organizationId: req.params.orgId,
          studentId: req.params.studentId,
        }),
      });

      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(storageFn).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Resource',
            organizationId: 'org-123',
            studentId: 'student-456',
          }),
        })
      );
    });

    it('should handle empty body with data injection', async () => {
      mockReq.params = { orgId: 'org-123' };
      mockReq.body = {};

      const storageFn = vi.fn().mockResolvedValue({});

      const handler = createHandler({
        storage: storageFn,
        dataInjection: (req) => ({ organizationId: req.params.orgId }),
      });

      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(storageFn).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: 'org-123',
          }),
        })
      );
    });
  });

  describe('Schema validation', () => {
    it('should validate request body with schema', async () => {
      const schema = z.object({
        name: z.string().min(1),
        email: z.string().email(),
      });

      mockReq.body = { name: 'John', email: 'john@example.com' };

      const storageFn = vi.fn().mockResolvedValue({ id: '1' });

      const handler = createHandler({
        storage: storageFn,
        schema,
      });

      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(storageFn).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { name: 'John', email: 'john@example.com' },
        })
      );
      expect(jsonMock).toHaveBeenCalledWith({ id: '1' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should pass validation errors to next()', async () => {
      const schema = z.object({
        email: z.string().email(),
      });

      mockReq.body = { email: 'invalid-email' };

      const storageFn = vi.fn();

      const handler = createHandler({
        storage: storageFn,
        schema,
      });

      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(z.ZodError));
      expect(storageFn).not.toHaveBeenCalled();
      expect(jsonMock).not.toHaveBeenCalled();
    });

    it('should validate and transform data', async () => {
      const schema = z.object({
        name: z.string().trim().toLowerCase(),
        age: z.string().transform((val) => parseInt(val, 10)),
      });

      mockReq.body = { name: '  JOHN  ', age: '25' };

      const storageFn = vi.fn().mockResolvedValue({ id: '1' });

      const handler = createHandler({
        storage: storageFn,
        schema,
      });

      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(storageFn).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { name: 'john', age: 25 },
        })
      );
    });
  });

  describe('Validation with data injection', () => {
    it('should inject data BEFORE validation', async () => {
      const schema = z.object({
        name: z.string(),
        organizationId: z.string(),
      });

      mockReq.params = { orgId: 'org-123' };
      mockReq.body = { name: 'Test' };

      const storageFn = vi.fn().mockResolvedValue({ id: '1' });

      const handler = createHandler({
        storage: storageFn,
        schema,
        dataInjection: (req) => ({ organizationId: req.params.orgId }),
      });

      await handler(mockReq as Request, mockRes as Response, mockNext);

      // Schema should validate successfully with injected organizationId
      expect(storageFn).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should fail validation if injected data is invalid', async () => {
      const schema = z.object({
        name: z.string(),
        organizationId: z.string().uuid(),
      });

      mockReq.params = { orgId: 'not-a-uuid' };
      mockReq.body = { name: 'Test' };

      const storageFn = vi.fn();

      const handler = createHandler({
        storage: storageFn,
        schema,
        dataInjection: (req) => ({ organizationId: req.params.orgId }),
      });

      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(z.ZodError));
      expect(storageFn).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should pass storage errors to next()', async () => {
      const error = new Error('Database error');
      const storageFn = vi.fn().mockRejectedValue(error);

      const handler = createHandler({
        storage: storageFn,
      });

      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(jsonMock).not.toHaveBeenCalled();
    });

    it('should handle database constraint errors', async () => {
      const error: any = new Error('Foreign key violation');
      error.code = '23503';

      const storageFn = vi.fn().mockRejectedValue(error);

      const handler = createHandler({
        storage: storageFn,
      });

      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should not modify error before passing to next()', async () => {
      const customError = { code: '23505', message: 'Duplicate entry' };
      const storageFn = vi.fn().mockRejectedValue(customError);

      const handler = createHandler({
        storage: storageFn,
      });

      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(customError);
    });
  });

  describe('Response handling', () => {
    it('should return JSON response from storage', async () => {
      const result = { id: '1', name: 'Test', value: 42 };
      const storageFn = vi.fn().mockResolvedValue(result);

      const handler = createHandler({
        storage: storageFn,
      });

      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(jsonMock).toHaveBeenCalledWith(result);
    });

    it('should handle array responses', async () => {
      const result = [{ id: '1' }, { id: '2' }];
      const storageFn = vi.fn().mockResolvedValue(result);

      const handler = createHandler({
        storage: storageFn,
      });

      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(jsonMock).toHaveBeenCalledWith(result);
    });

    it('should handle null responses', async () => {
      const storageFn = vi.fn().mockResolvedValue(null);

      const handler = createHandler({
        storage: storageFn,
      });

      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(jsonMock).toHaveBeenCalledWith(null);
    });

    it('should handle empty object responses', async () => {
      const storageFn = vi.fn().mockResolvedValue({});

      const handler = createHandler({
        storage: storageFn,
      });

      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(jsonMock).toHaveBeenCalledWith({});
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle GET /api/organizations/:orgId/students', async () => {
      mockReq.params = { orgId: 'org-123' };

      const storageFn = vi.fn().mockResolvedValue([
        { id: '1', name: 'Student 1' },
        { id: '2', name: 'Student 2' },
      ]);

      const handler = createHandler({
        storage: ({ orgId }) => storageFn(orgId),
      });

      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(storageFn).toHaveBeenCalledWith('org-123');
      expect(jsonMock).toHaveBeenCalledWith([
        { id: '1', name: 'Student 1' },
        { id: '2', name: 'Student 2' },
      ]);
    });

    it('should handle POST /api/organizations/:orgId/students with validation', async () => {
      mockReq.params = { orgId: 'org-123' };
      mockReq.body = { name: 'New Student', email: 'student@example.com' };

      const schema = z.object({
        name: z.string().min(1),
        email: z.string().email().optional(),
        organizationId: z.string(),
      });

      const storageFn = vi.fn().mockResolvedValue({ id: 'new-123', name: 'New Student' });

      const handler = createHandler({
        storage: ({ data }) => storageFn(data),
        schema,
        dataInjection: (req) => ({ organizationId: req.params.orgId }),
      });

      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(storageFn).toHaveBeenCalledWith({
        name: 'New Student',
        email: 'student@example.com',
        organizationId: 'org-123',
      });
      expect(jsonMock).toHaveBeenCalledWith({ id: 'new-123', name: 'New Student' });
    });

    it('should handle DELETE /api/organizations/:orgId/students/:id', async () => {
      mockReq.params = { orgId: 'org-123', id: 'student-456' };

      const storageFn = vi.fn().mockResolvedValue({ success: true });

      const handler = createHandler({
        storage: ({ orgId, id }) => storageFn(id, orgId),
      });

      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(storageFn).toHaveBeenCalledWith('student-456', 'org-123');
      expect(jsonMock).toHaveBeenCalledWith({ success: true });
    });

    it('should handle nested routes /api/organizations/:orgId/students/:studentId/resources', async () => {
      mockReq.params = {
        orgId: 'org-123',
        studentId: 'student-456',
      };

      const storageFn = vi.fn().mockResolvedValue([
        { id: '1', title: 'Resource 1' },
      ]);

      const handler = createHandler({
        storage: ({ orgId, studentId }) => storageFn(studentId, orgId),
      });

      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(storageFn).toHaveBeenCalledWith('student-456', 'org-123');
    });
  });

  describe('Edge cases', () => {
    it('should handle missing params gracefully', async () => {
      mockReq.params = {};

      const storageFn = vi.fn().mockResolvedValue([]);

      const handler = createHandler({
        storage: storageFn,
      });

      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(storageFn).toHaveBeenCalledWith(
        expect.objectContaining({
          orgId: undefined,
          id: undefined,
          studentId: undefined,
        })
      );
    });

    it('should handle missing session gracefully', async () => {
      mockReq.session = undefined as any;

      const storageFn = vi.fn().mockResolvedValue({});

      const handler = createHandler({
        storage: storageFn,
      });

      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(storageFn).toHaveBeenCalledWith(
        expect.objectContaining({ userId: undefined })
      );
    });

    it('should handle extra params beyond orgId, id, studentId', async () => {
      mockReq.params = {
        orgId: 'org-123',
        categoryId: 'cat-456',
        customParam: 'value',
      };

      const storageFn = vi.fn().mockResolvedValue({});

      const handler = createHandler({
        storage: storageFn,
      });

      await handler(mockReq as Request, mockRes as Response, mockNext);

      expect(storageFn).toHaveBeenCalledWith(
        expect.objectContaining({
          orgId: 'org-123',
          categoryId: 'cat-456',
          customParam: 'value',
        })
      );
    });
  });
});
