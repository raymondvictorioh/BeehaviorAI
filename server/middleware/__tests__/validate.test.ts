import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../validate';

describe('validate middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      body: {},
    };
    mockRes = {};
    mockNext = vi.fn();
  });

  describe('Successful validation', () => {
    it('should pass valid data through', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      mockReq.body = { name: 'John', age: 30 };

      const middleware = validate(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.body).toEqual({ name: 'John', age: 30 });
    });

    it('should transform data according to schema', () => {
      const schema = z.object({
        name: z.string().trim().toLowerCase(),
        age: z.string().transform((val) => parseInt(val, 10)),
      });

      mockReq.body = { name: '  JOHN  ', age: '25' };

      const middleware = validate(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.body).toEqual({ name: 'john', age: 25 });
    });

    it('should handle optional fields', () => {
      const schema = z.object({
        name: z.string(),
        email: z.string().email().optional(),
      });

      mockReq.body = { name: 'John' };

      const middleware = validate(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.body).toEqual({ name: 'John' });
    });

    it('should handle default values', () => {
      const schema = z.object({
        name: z.string(),
        role: z.string().default('user'),
      });

      mockReq.body = { name: 'John' };

      const middleware = validate(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.body).toEqual({ name: 'John', role: 'user' });
    });

    it('should strip extra fields with strict()', () => {
      const schema = z.object({
        name: z.string(),
      }).strict();

      mockReq.body = { name: 'John', extra: 'field' };

      const middleware = validate(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      // With strict(), Zod will throw on extra fields
      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as any).mock.calls[0][0];
      expect(error).toBeDefined();
    });
  });

  describe('Validation errors', () => {
    it('should pass ZodError to next() on validation failure', () => {
      const schema = z.object({
        email: z.string().email(),
      });

      mockReq.body = { email: 'invalid-email' };

      const middleware = validate(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(z.ZodError));
    });

    it('should include detailed error information', () => {
      const schema = z.object({
        name: z.string().min(3),
        age: z.number().min(18),
      });

      mockReq.body = { name: 'Jo', age: 15 };

      const middleware = validate(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      const error = (mockNext as any).mock.calls[0][0];
      expect(error).toBeInstanceOf(z.ZodError);
      expect(error.errors.length).toBe(2);
    });

    it('should handle missing required fields', () => {
      const schema = z.object({
        name: z.string(),
        email: z.string().email(),
      });

      mockReq.body = { name: 'John' }; // Missing email

      const middleware = validate(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      const error = (mockNext as any).mock.calls[0][0];
      expect(error).toBeInstanceOf(z.ZodError);
    });

    it('should handle type mismatches', () => {
      const schema = z.object({
        age: z.number(),
      });

      mockReq.body = { age: 'not a number' };

      const middleware = validate(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      const error = (mockNext as any).mock.calls[0][0];
      expect(error).toBeInstanceOf(z.ZodError);
    });

    it('should handle nested object validation errors', () => {
      const schema = z.object({
        user: z.object({
          name: z.string().min(3),
          email: z.string().email(),
        }),
      });

      mockReq.body = {
        user: {
          name: 'Jo',
          email: 'invalid',
        },
      };

      const middleware = validate(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      const error = (mockNext as any).mock.calls[0][0];
      expect(error).toBeInstanceOf(z.ZodError);
      expect(error.errors.length).toBe(2);
    });
  });

  describe('Complex schemas', () => {
    it('should validate arrays', () => {
      const schema = z.object({
        tags: z.array(z.string()),
      });

      mockReq.body = { tags: ['javascript', 'typescript'] };

      const middleware = validate(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.body).toEqual({ tags: ['javascript', 'typescript'] });
    });

    it('should validate nested objects', () => {
      const schema = z.object({
        user: z.object({
          name: z.string(),
          address: z.object({
            street: z.string(),
            city: z.string(),
          }),
        }),
      });

      mockReq.body = {
        user: {
          name: 'John',
          address: {
            street: '123 Main St',
            city: 'Boston',
          },
        },
      };

      const middleware = validate(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.body.user.address.city).toBe('Boston');
    });

    it('should validate unions', () => {
      const schema = z.object({
        value: z.union([z.string(), z.number()]),
      });

      mockReq.body = { value: 'text' };

      const middleware = validate(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should validate enums', () => {
      const schema = z.object({
        role: z.enum(['admin', 'user', 'guest']),
      });

      mockReq.body = { role: 'admin' };

      const middleware = validate(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should fail on invalid enum values', () => {
      const schema = z.object({
        role: z.enum(['admin', 'user', 'guest']),
      });

      mockReq.body = { role: 'superadmin' };

      const middleware = validate(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      const error = (mockNext as any).mock.calls[0][0];
      expect(error).toBeInstanceOf(z.ZodError);
    });
  });

  describe('Schema refinements and custom validations', () => {
    it('should apply custom refinements', () => {
      const schema = z.object({
        password: z.string().min(8),
        confirmPassword: z.string(),
      }).refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      });

      mockReq.body = {
        password: 'password123',
        confirmPassword: 'password123',
      };

      const middleware = validate(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should fail custom refinements', () => {
      const schema = z.object({
        password: z.string().min(8),
        confirmPassword: z.string(),
      }).refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
      });

      mockReq.body = {
        password: 'password123',
        confirmPassword: 'different',
      };

      const middleware = validate(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      const error = (mockNext as any).mock.calls[0][0];
      expect(error).toBeInstanceOf(z.ZodError);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty body', () => {
      const schema = z.object({
        name: z.string().optional(),
      });

      mockReq.body = {};

      const middleware = validate(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle null body', () => {
      const schema = z.object({
        name: z.string(),
      });

      mockReq.body = null;

      const middleware = validate(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      const error = (mockNext as any).mock.calls[0][0];
      expect(error).toBeInstanceOf(z.ZodError);
    });

    it('should handle undefined body', () => {
      const schema = z.object({
        name: z.string(),
      });

      mockReq.body = undefined;

      const middleware = validate(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      const error = (mockNext as any).mock.calls[0][0];
      expect(error).toBeInstanceOf(z.ZodError);
    });

    it('should not modify req.body on validation errors', () => {
      const schema = z.object({
        email: z.string().email(),
      });

      const originalBody = { email: 'invalid' };
      mockReq.body = originalBody;

      const middleware = validate(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      // Body should remain unchanged when validation fails
      expect(mockReq.body).toEqual(originalBody);
    });
  });

  describe('Integration with real schemas', () => {
    it('should work with insertStudentSchema-like schema', () => {
      const schema = z.object({
        name: z.string().min(1),
        email: z.string().email().optional(),
        classId: z.string().optional(),
        gender: z.enum(['Male', 'Female', 'Other']).optional(),
        organizationId: z.string(),
      });

      mockReq.body = {
        name: 'John Doe',
        email: 'john@example.com',
        gender: 'Male',
        organizationId: 'org-123',
      };

      const middleware = validate(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.body.name).toBe('John Doe');
    });

    it('should work with updateSchema (partial)', () => {
      const schema = z.object({
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
      });

      mockReq.body = { name: 'Updated Name' };

      const middleware = validate(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });
});
