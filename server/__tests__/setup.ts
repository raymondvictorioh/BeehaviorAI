/**
 * Test setup file for Vitest
 * Sets up environment variables and global mocks for all tests
 */

// Set required environment variables for tests
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.SESSION_SECRET = 'test-session-secret-key-for-testing-only';

// Supabase credentials for tests (mock values)
process.env.PROD_SUPABASE_URL = 'https://test.supabase.co';
process.env.PROD_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.DEV_SUPABASE_URL = 'https://test.supabase.co';
process.env.DEV_SUPABASE_ANON_KEY = 'test-anon-key';
