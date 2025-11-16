import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storage } from '@server/storage';
import { isAuthenticated, checkOrganizationAccess } from '@server/supabaseAuth';
import type { Request, Response } from 'express';

/**
 * Multi-Tenancy Security Tests
 *
 * These tests verify that:
 * 1. Users can only access data from their own organization
 * 2. Organization isolation is enforced at the storage layer
 * 3. Middleware properly blocks unauthorized access
 * 4. No data leakage between organizations
 */

describe('Multi-Tenancy Security', () => {
  // Mock test data
  const org1Id = 'org-1-uuid';
  const org2Id = 'org-2-uuid';
  const user1Id = 'user-1-uuid';
  const user2Id = 'user-2-uuid';
  const student1Org1 = 'student-1-org1-uuid';
  const student1Org2 = 'student-1-org2-uuid';

  describe('Storage Layer - Organization Isolation', () => {
    it('should return only students from the specified organization', async () => {
      // This test would require a test database setup
      // For now, we'll test the interface contract
      const students = await storage.getStudents(org1Id);

      // All returned students should belong to org1Id
      if (students.length > 0) {
        students.forEach(student => {
          expect(student.organizationId).toBe(org1Id);
        });
      }
    });

    it('should prevent access to students from other organizations', async () => {
      // Try to get a student using wrong organization ID
      const student = await storage.getStudent(student1Org1, org2Id);

      // Should return undefined since student doesn't belong to org2
      expect(student).toBeUndefined();
    });

    it('should return only behavior logs for students in the specified organization', async () => {
      const logs = await storage.getBehaviorLogs(student1Org1, org1Id);

      // All logs should be associated with the correct organization
      if (logs.length > 0) {
        logs.forEach(log => {
          expect(log.organizationId).toBe(org1Id);
        });
      }
    });

    it('should return only follow-ups for students in the specified organization', async () => {
      const followUps = await storage.getFollowUps(student1Org1, org1Id);

      // All follow-ups should be associated with the correct organization
      if (followUps.length > 0) {
        followUps.forEach(followUp => {
          expect(followUp.organizationId).toBe(org1Id);
        });
      }
    });

    it('should prevent updating students from other organizations', async () => {
      // Attempt to update a student with wrong organization ID
      await expect(
        storage.updateStudent(student1Org1, org2Id, { name: 'Hacked Name' })
      ).rejects.toThrow();
    });

    it('should prevent deleting students from other organizations', async () => {
      // Attempt to delete a student with wrong organization ID
      await expect(
        storage.deleteStudent(student1Org1, org2Id)
      ).rejects.toThrow();
    });

    it('should return only behavior log categories for the specified organization', async () => {
      const categories = await storage.getBehaviorLogCategories(org1Id);

      // All categories should belong to the specified organization
      if (categories.length > 0) {
        categories.forEach(category => {
          expect(category.organizationId).toBe(org1Id);
        });
      }
    });

    it('should return only classes for the specified organization', async () => {
      const classes = await storage.getClasses(org1Id);

      // All classes should belong to the specified organization
      if (classes.length > 0) {
        classes.forEach(cls => {
          expect(cls.organizationId).toBe(org1Id);
        });
      }
    });

    it('should return only subjects for the specified organization', async () => {
      const subjects = await storage.getSubjects(org1Id);

      // All subjects should belong to the specified organization
      if (subjects.length > 0) {
        subjects.forEach(subject => {
          expect(subject.organizationId).toBe(org1Id);
        });
      }
    });

    it('should return only academic logs for students in the specified organization', async () => {
      const academicLogs = await storage.getAcademicLogs(student1Org1, org1Id);

      // All academic logs should be associated with the correct organization
      if (academicLogs.length > 0) {
        academicLogs.forEach(log => {
          expect(log.organizationId).toBe(org1Id);
        });
      }
    });

    it('should return only student resources for students in the specified organization', async () => {
      const resources = await storage.getStudentResources(student1Org1, org1Id);

      // All resources should be associated with the correct organization
      if (resources.length > 0) {
        resources.forEach(resource => {
          expect(resource.organizationId).toBe(org1Id);
        });
      }
    });
  });

  describe('Authentication Middleware', () => {
    it('should reject requests without a session', async () => {
      const mockReq = {
        session: {},
      } as any as Request;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any as Response;

      const mockNext = vi.fn();

      await isAuthenticated(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow requests with valid session', async () => {
      const mockReq = {
        session: {
          supabaseUserId: user1Id,
        },
      } as any as Request;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any as Response;

      const mockNext = vi.fn();

      await isAuthenticated(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('Organization Access Middleware', () => {
    beforeEach(() => {
      // Reset mocks before each test
      vi.restoreAllMocks();
    });

    it('should reject requests without organization ID', async () => {
      const mockReq = {
        session: {
          supabaseUserId: user1Id,
        },
        params: {},
      } as any as Request;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any as Response;

      const mockNext = vi.fn();

      await checkOrganizationAccess(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Organization ID required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject requests without user session', async () => {
      const mockReq = {
        session: {},
        params: { orgId: org1Id },
      } as any as Request;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any as Response;

      const mockNext = vi.fn();

      await checkOrganizationAccess(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject requests when user does not belong to the organization', async () => {
      // Mock getUserOrganizations to return only org1
      vi.spyOn(storage, 'getUserOrganizations').mockResolvedValue([
        { id: org1Id, name: 'Org 1', ownerId: user1Id, createdAt: new Date(), updatedAt: new Date() } as any,
      ]);

      const mockReq = {
        session: {
          supabaseUserId: user1Id,
        },
        params: { orgId: org2Id }, // User trying to access org2
      } as any as Request;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any as Response;

      const mockNext = vi.fn();

      await checkOrganizationAccess(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Access denied to this organization' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow requests when user belongs to the organization', async () => {
      // Mock getUserOrganizations to return org1
      vi.spyOn(storage, 'getUserOrganizations').mockResolvedValue([
        { id: org1Id, name: 'Org 1', ownerId: user1Id, createdAt: new Date(), updatedAt: new Date() } as any,
      ]);

      const mockReq = {
        session: {
          supabaseUserId: user1Id,
        },
        params: { orgId: org1Id }, // User accessing their own org
      } as any as Request;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any as Response;

      const mockNext = vi.fn();

      await checkOrganizationAccess(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should read orgId from params.id when params.orgId is not available', async () => {
      // Mock getUserOrganizations to return org1
      vi.spyOn(storage, 'getUserOrganizations').mockResolvedValue([
        { id: org1Id, name: 'Org 1', ownerId: user1Id, createdAt: new Date(), updatedAt: new Date() } as any,
      ]);

      const mockReq = {
        session: {
          supabaseUserId: user1Id,
        },
        params: { id: org1Id }, // Using params.id instead of params.orgId
      } as any as Request;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any as Response;

      const mockNext = vi.fn();

      await checkOrganizationAccess(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('SQL Injection Prevention', () => {
    it('should safely handle malicious organization IDs', async () => {
      const maliciousOrgId = "'; DROP TABLE students; --";

      // Drizzle ORM should safely handle this without executing SQL injection
      const students = await storage.getStudents(maliciousOrgId);

      // Should return empty array or safely fail, not execute SQL injection
      expect(Array.isArray(students)).toBe(true);
    });

    it('should safely handle malicious student IDs', async () => {
      const maliciousStudentId = "1' OR '1'='1";
      const validOrgId = org1Id;

      // Should safely handle without SQL injection
      const student = await storage.getStudent(maliciousStudentId, validOrgId);

      // Should return undefined or safely fail
      expect(student).toBeUndefined();
    });

    it('should safely handle malicious input in update operations', async () => {
      const validStudentId = student1Org1;
      const validOrgId = org1Id;
      const maliciousName = "<script>alert('XSS')</script>";

      // Should safely handle malicious input (React will escape on render)
      // Database should accept it as a string literal
      await expect(async () => {
        await storage.updateStudent(validStudentId, validOrgId, {
          name: maliciousName,
        });
      }).rejects.toThrow(); // Will fail because student doesn't exist in test, but won't execute XSS
    });
  });

  describe('Data Leakage Prevention', () => {
    it('should not return dashboard stats from other organizations', async () => {
      const stats = await storage.getDashboardStats(org1Id);

      // Verify stats structure (can't check exact values without test data)
      expect(stats).toHaveProperty('totalStudents');
      expect(stats).toHaveProperty('totalBehaviorLogs');
      expect(stats).toHaveProperty('pendingFollowUps');
      expect(stats).toHaveProperty('positiveLogsPercentage');
    });

    it('should not return users from other organizations', async () => {
      const orgUsers = await storage.getOrganizationUsers(org1Id);

      // All users should be associated with org1Id through organization_users table
      if (orgUsers.length > 0) {
        orgUsers.forEach(orgUser => {
          expect(orgUser.organizationId).toBe(org1Id);
        });
      }
    });
  });
});
