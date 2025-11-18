import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { isAuthenticated, checkOrganizationAccess } from '../../supabaseAuth';
import { storage } from '../../storage';

// Mock storage
vi.mock('../../storage', () => ({
  storage: {
    getUserOrganizations: vi.fn(),
  },
}));

describe('isAuthenticated middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    mockReq = {
      session: {} as any,
    };
    mockRes = {
      status: statusMock,
      json: jsonMock,
    };
    mockNext = vi.fn();
  });

  it('should return 401 when session object is empty', async () => {
    // In practice, Express session middleware always creates a session object,
    // but it may be empty if the user hasn't logged in
    mockReq.session = {} as any;

    await isAuthenticated(mockReq as Request, mockRes as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ message: 'Unauthorized' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 when supabaseUserId is missing from session', async () => {
    mockReq.session = {} as any;

    await isAuthenticated(mockReq as Request, mockRes as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ message: 'Unauthorized' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should call next() when session contains valid supabaseUserId', async () => {
    mockReq.session = {
      supabaseUserId: 'user-123',
    } as any;

    await isAuthenticated(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });

  it('should handle empty string supabaseUserId as unauthorized', async () => {
    mockReq.session = {
      supabaseUserId: '',
    } as any;

    await isAuthenticated(mockReq as Request, mockRes as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ message: 'Unauthorized' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should handle null supabaseUserId as unauthorized', async () => {
    mockReq.session = {
      supabaseUserId: null,
    } as any;

    await isAuthenticated(mockReq as Request, mockRes as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ message: 'Unauthorized' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should handle undefined supabaseUserId as unauthorized', async () => {
    mockReq.session = {
      supabaseUserId: undefined,
    } as any;

    await isAuthenticated(mockReq as Request, mockRes as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ message: 'Unauthorized' });
    expect(mockNext).not.toHaveBeenCalled();
  });
});

describe('checkOrganizationAccess middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    mockReq = {
      session: {} as any,
      params: {},
    };
    mockRes = {
      status: statusMock,
      json: jsonMock,
    };
    mockNext = vi.fn();

    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should return 400 when organization ID is missing', async () => {
    mockReq.session = { supabaseUserId: 'user-123' } as any;
    mockReq.params = {};

    await checkOrganizationAccess(mockReq as Request, mockRes as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ message: 'Organization ID required' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 when userId is missing from session', async () => {
    mockReq.session = {} as any;
    mockReq.params = { orgId: 'org-123' };

    await checkOrganizationAccess(mockReq as Request, mockRes as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ message: 'Unauthorized' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 403 when user does not have access to organization', async () => {
    mockReq.session = { supabaseUserId: 'user-123' } as any;
    mockReq.params = { orgId: 'org-999' };

    vi.mocked(storage.getUserOrganizations).mockResolvedValue([
      { id: 'org-123', name: 'Org 1', code: 'ORG1', email: null, phone: null, address: null, ownerId: 'user-123', createdAt: new Date() },
      { id: 'org-456', name: 'Org 2', code: 'ORG2', email: null, phone: null, address: null, ownerId: 'user-123', createdAt: new Date() },
    ]);

    await checkOrganizationAccess(mockReq as Request, mockRes as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({ message: 'Access denied to this organization' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should call next() when user has access to organization', async () => {
    mockReq.session = { supabaseUserId: 'user-123' } as any;
    mockReq.params = { orgId: 'org-123' };

    vi.mocked(storage.getUserOrganizations).mockResolvedValue([
      { id: 'org-123', name: 'Org 1', code: 'ORG1', email: null, phone: null, address: null, ownerId: 'user-123', createdAt: new Date() },
      { id: 'org-456', name: 'Org 2', code: 'ORG2', email: null, phone: null, address: null, ownerId: 'user-123', createdAt: new Date() },
    ]);

    await checkOrganizationAccess(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });

  it('should check orgId parameter from params.id when orgId is not present', async () => {
    mockReq.session = { supabaseUserId: 'user-123' } as any;
    mockReq.params = { id: 'org-789' };

    vi.mocked(storage.getUserOrganizations).mockResolvedValue([
      { id: 'org-789', name: 'Org 3', code: 'ORG3', email: null, phone: null, address: null, ownerId: 'user-123', createdAt: new Date() },
    ]);

    await checkOrganizationAccess(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });

  it('should return 500 when getUserOrganizations throws an error', async () => {
    mockReq.session = { supabaseUserId: 'user-123' } as any;
    mockReq.params = { orgId: 'org-123' };

    vi.mocked(storage.getUserOrganizations).mockRejectedValue(new Error('Database error'));

    await checkOrganizationAccess(mockReq as Request, mockRes as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({ message: 'Failed to verify organization access' });
    expect(mockNext).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });

  it('should handle empty organizations array as no access', async () => {
    mockReq.session = { supabaseUserId: 'user-123' } as any;
    mockReq.params = { orgId: 'org-123' };

    vi.mocked(storage.getUserOrganizations).mockResolvedValue([]);

    await checkOrganizationAccess(mockReq as Request, mockRes as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({ message: 'Access denied to this organization' });
    expect(mockNext).not.toHaveBeenCalled();
  });
});
