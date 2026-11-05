import request from "supertest";
import { createApp } from "../src/app";
import { testDb } from "./db";

export const TEST_JWT_SECRET = "test-secret-that-is-at-least-32-characters";

export function createTestApp() {
  return createApp({ db: testDb, jwtSecret: TEST_JWT_SECRET, secureCookies: false });
}

/** Registers a user and returns an agent that sends their session cookie on every request. */
export async function signedInAgent(email: string) {
  const agent = request.agent(createTestApp());
  const res = await agent.post("/api/auth/register").send({ email, password: "correct horse battery" });

  if (res.status !== 201) throw new Error(`Registering ${email} failed with ${res.status}`);

  return agent;
}
