import { beforeAll, afterAll, afterEach, vi } from 'vitest';
import dotenv from 'dotenv';

// Load environment variables for testing
dotenv.config();

// Set test environment
process.env.NODE_ENV = 'test';

// Mock console methods to reduce noise in test output (optional)
// Uncomment if you want cleaner test output
// global.console = {
//   ...console,
//   log: vi.fn(),
//   debug: vi.fn(),
//   info: vi.fn(),
//   warn: vi.fn(),
// };

beforeAll(async () => {
  // Setup code that runs once before all tests
  // For example: initialize test database, seed data, etc.
});

afterEach(() => {
  // Clear all mocks after each test
  vi.clearAllMocks();
});

afterAll(async () => {
  // Cleanup code that runs once after all tests
  // For example: close database connections, cleanup test data, etc.
});
