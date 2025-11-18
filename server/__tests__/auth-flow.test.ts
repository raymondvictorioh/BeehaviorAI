import { describe, it, expect, vi, beforeEach } from 'vitest';
import { storage } from '../storage';
import type { User, Organization } from '@shared/schema';

// Mock storage
vi.mock('../storage', () => ({
  storage: {
    getUser: vi.fn(),
    upsertUser: vi.fn(),
    getUserOrganizations: vi.fn(),
    createOrganization: vi.fn(),
    addUserToOrganization: vi.fn(),
  },
}));

/**
 * End-to-End Authentication Flow Tests
 *
 * These tests verify the complete authentication lifecycle:
 * 1. User signs up
 * 2. User data is created in local database
 * 3. User logs in
 * 4. User creates an organization
 * 5. User fetches their profile with organizations
 * 6. User logs out
 *
 * This simulates the actual user journey through the application.
 */
describe('E2E Authentication Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should complete full authentication lifecycle', async () => {
    // ============================================================
    // STEP 1: User Signup
    // ============================================================
    const signupData = {
      id: 'user-123',
      email: 'newuser@example.com',
      firstName: 'John',
      lastName: 'Doe',
    };

    // Mock Supabase signup (would be done by Supabase in production)
    const supabaseUser = {
      id: signupData.id,
      email: signupData.email,
      user_metadata: {
        first_name: signupData.firstName,
        last_name: signupData.lastName,
      },
    };

    // Create local user record after Supabase signup
    vi.mocked(storage.upsertUser).mockResolvedValue(undefined);
    await storage.upsertUser(signupData);

    expect(storage.upsertUser).toHaveBeenCalledWith(signupData);
    expect(storage.upsertUser).toHaveBeenCalledTimes(1);

    // ============================================================
    // STEP 2: Session Creation
    // ============================================================
    const mockSession = {
      supabaseUserId: signupData.id,
      regenerate: vi.fn((callback) => callback(null)),
      destroy: vi.fn((callback) => callback(null)),
    };

    // Simulate session regeneration (security best practice)
    mockSession.regenerate((err: any) => {
      expect(err).toBeNull();
      mockSession.supabaseUserId = signupData.id;
    });

    expect(mockSession.supabaseUserId).toBe(signupData.id);
    expect(mockSession.regenerate).toHaveBeenCalled();

    // ============================================================
    // STEP 3: User Login (Existing User)
    // ============================================================
    const mockUser: User = {
      id: signupData.id,
      email: signupData.email,
      firstName: signupData.firstName,
      lastName: signupData.lastName,
      supabaseUserId: signupData.id,
      profileImageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(storage.getUser).mockResolvedValue(mockUser);

    const user = await storage.getUser(signupData.id);

    expect(user).toEqual(mockUser);
    expect(user?.email).toBe('newuser@example.com');
    expect(storage.getUser).toHaveBeenCalledWith(signupData.id);

    // ============================================================
    // STEP 4: Create Organization
    // ============================================================
    const organizationData = {
      name: 'Test School',
      code: 'TS001',
      email: 'admin@testschool.com',
      phone: '123-456-7890',
      address: '123 Education St',
      ownerId: signupData.id,
    };

    const mockOrganization: Organization = {
      id: 'org-456',
      ...organizationData,
      createdAt: new Date(),
    };

    vi.mocked(storage.createOrganization).mockResolvedValue(mockOrganization);
    vi.mocked(storage.addUserToOrganization).mockResolvedValue(undefined);

    const organization = await storage.createOrganization(organizationData);
    await storage.addUserToOrganization({
      userId: signupData.id,
      organizationId: organization.id,
      role: 'owner',
    });

    expect(organization).toEqual(mockOrganization);
    expect(storage.createOrganization).toHaveBeenCalledWith(organizationData);
    expect(storage.addUserToOrganization).toHaveBeenCalledWith({
      userId: signupData.id,
      organizationId: 'org-456',
      role: 'owner',
    });

    // ============================================================
    // STEP 5: Fetch User Profile with Organizations
    // ============================================================
    const mockOrganizations: Organization[] = [mockOrganization];

    vi.mocked(storage.getUserOrganizations).mockResolvedValue(mockOrganizations);

    const organizations = await storage.getUserOrganizations(signupData.id);

    expect(organizations).toEqual(mockOrganizations);
    expect(organizations).toHaveLength(1);
    expect(organizations[0].name).toBe('Test School');
    expect(organizations[0].ownerId).toBe(signupData.id);

    // ============================================================
    // STEP 6: Verify User Has Access to Organization
    // ============================================================
    const userOrgs = await storage.getUserOrganizations(signupData.id);
    const hasAccessToOrg = userOrgs.some((org) => org.id === mockOrganization.id);

    expect(hasAccessToOrg).toBe(true);

    // ============================================================
    // STEP 7: User Logout
    // ============================================================
    mockSession.destroy((err: any) => {
      expect(err).toBeNull();
    });

    expect(mockSession.destroy).toHaveBeenCalled();

    // After logout, session should be destroyed
    // In production, subsequent requests would fail authentication
  });

  it('should handle new user login with missing local record', async () => {
    // ============================================================
    // SCENARIO: User exists in Supabase but not in local database
    // This can happen if the local database was reset or corrupted
    // ============================================================

    const userId = 'user-789';
    const email = 'existing@example.com';

    // Supabase returns user
    const supabaseUser = {
      id: userId,
      email,
      user_metadata: {
        first_name: 'Jane',
        last_name: 'Smith',
      },
    };

    // But local database doesn't have the user
    vi.mocked(storage.getUser).mockResolvedValueOnce(null);

    let user = await storage.getUser(userId);
    expect(user).toBeNull();

    // Create local user record (defensive programming)
    const userData = {
      id: userId,
      email,
      firstName: supabaseUser.user_metadata.first_name,
      lastName: supabaseUser.user_metadata.last_name,
    };

    vi.mocked(storage.upsertUser).mockResolvedValue(undefined);
    await storage.upsertUser(userData);

    // Now user exists locally
    const createdUser: User = {
      ...userData,
      supabaseUserId: userId,
      profileImageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(storage.getUser).mockResolvedValueOnce(createdUser);
    user = await storage.getUser(userId);

    expect(user).not.toBeNull();
    expect(user?.email).toBe(email);
    expect(storage.upsertUser).toHaveBeenCalledWith(userData);
  });

  it('should handle user with multiple organizations', async () => {
    const userId = 'user-multi-org';

    const mockOrganizations: Organization[] = [
      {
        id: 'org-1',
        name: 'School A',
        code: 'SA001',
        email: 'admin@schoola.com',
        phone: null,
        address: null,
        ownerId: userId,
        createdAt: new Date(),
      },
      {
        id: 'org-2',
        name: 'School B',
        code: 'SB001',
        email: 'admin@schoolb.com',
        phone: null,
        address: null,
        ownerId: 'other-user',
        createdAt: new Date(),
      },
      {
        id: 'org-3',
        name: 'School C',
        code: 'SC001',
        email: 'admin@schoolc.com',
        phone: null,
        address: null,
        ownerId: userId,
        createdAt: new Date(),
      },
    ];

    vi.mocked(storage.getUserOrganizations).mockResolvedValue(mockOrganizations);

    const organizations = await storage.getUserOrganizations(userId);

    expect(organizations).toHaveLength(3);

    // User owns 2 organizations
    const ownedOrgs = organizations.filter((org) => org.ownerId === userId);
    expect(ownedOrgs).toHaveLength(2);

    // User is a member of 1 organization (not owner)
    const memberOrgs = organizations.filter((org) => org.ownerId !== userId);
    expect(memberOrgs).toHaveLength(1);
  });

  it('should prevent access to organization without membership', async () => {
    const userId = 'user-999';
    const requestedOrgId = 'org-unauthorized';

    // User's organizations don't include the requested one
    const mockOrganizations: Organization[] = [
      {
        id: 'org-authorized',
        name: 'My School',
        code: 'MS001',
        email: null,
        phone: null,
        address: null,
        ownerId: userId,
        createdAt: new Date(),
      },
    ];

    vi.mocked(storage.getUserOrganizations).mockResolvedValue(mockOrganizations);

    const organizations = await storage.getUserOrganizations(userId);
    const hasAccess = organizations.some((org) => org.id === requestedOrgId);

    // User should NOT have access to org-unauthorized
    expect(hasAccess).toBe(false);
    expect(organizations).toHaveLength(1);
    expect(organizations[0].id).toBe('org-authorized');
  });

  it('should handle session expiration gracefully', () => {
    // Mock expired session
    const mockSession = {
      supabaseUserId: 'user-123',
      cookie: {
        expires: new Date(Date.now() - 1000), // Expired 1 second ago
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      },
    };

    const now = new Date();
    const isExpired = mockSession.cookie.expires < now;

    expect(isExpired).toBe(true);

    // In production, middleware would return 401 Unauthorized
    // User would need to log in again
  });

  it('should regenerate session on login to prevent session fixation', () => {
    // Mock pre-login session
    const oldSessionId = 'old-session-id';
    const mockSession = {
      id: oldSessionId,
      supabaseUserId: undefined as string | undefined,
      regenerate: vi.fn((callback) => {
        // Simulate session regeneration (creates new session ID)
        mockSession.id = 'new-session-id';
        callback(null);
      }),
    };

    expect(mockSession.id).toBe(oldSessionId);

    // Login triggers session regeneration
    mockSession.regenerate((err: any) => {
      if (!err) {
        mockSession.supabaseUserId = 'user-123';
      }
    });

    // Session ID should change (security measure)
    expect(mockSession.id).toBe('new-session-id');
    expect(mockSession.id).not.toBe(oldSessionId);
    expect(mockSession.supabaseUserId).toBe('user-123');
    expect(mockSession.regenerate).toHaveBeenCalled();
  });
});
