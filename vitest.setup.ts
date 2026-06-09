import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Setup environment variables for tests
vi.stubEnv("BETTER_AUTH_SECRET", "test-secret-key");
vi.stubEnv("DATABASE_URL", "postgresql://test:test@localhost:5432/test");
vi.stubEnv("BETTER_AUTH_GOOGLE_CLIENT_ID", "test-client-id");
vi.stubEnv("BETTER_AUTH_GOOGLE_CLIENT_SECRET", "test-client-secret");
vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3000");

// Cleanup after each test
afterEach(() => {
  cleanup();
});
