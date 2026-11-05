import { createApp } from "../src/app";
import { testDb } from "./db";

export const TEST_JWT_SECRET = "test-secret-that-is-at-least-32-characters";

export function createTestApp() {
  return createApp({ db: testDb, jwtSecret: TEST_JWT_SECRET, secureCookies: false });
}
