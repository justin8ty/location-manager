import { apiErrorResponseSchema, userResponseSchema } from "@location-manager/shared";
import { decodeJwt, SignJWT } from "jose";
import request, { type Response } from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createApp } from "../src/app";
import { users } from "../src/db/schema";
import { AUTH_RATE_LIMIT } from "../src/routes/auth";
import { createTestApp, TEST_JWT_SECRET } from "./app";
import { resetDb, testDb } from "./db";

const credentials = { email: "Alice@Example.com", password: "correct horse battery" };
const DAY_MS = 24 * 60 * 60 * 1000;

function tokenCookie(res: Response): string | undefined {
  const cookies = z.array(z.string()).optional().parse(res.headers["set-cookie"]);

  return cookies?.find((cookie) => cookie.startsWith("token="));
}

function tokenFrom(cookie: string | undefined): string {
  const token = cookie?.split(";")[0]?.slice("token=".length);

  if (!token) throw new Error(`No token in cookie: ${cookie}`);

  return token;
}

function errorCode(res: Response) {
  return apiErrorResponseSchema.parse(res.body).error.code;
}

async function register() {
  const res = await request(createTestApp()).post("/api/auth/register").send(credentials);
  expect(res.status).toBe(201);

  return { user: userResponseSchema.parse(res.body).user, token: tokenFrom(tokenCookie(res)) };
}

function me(token: string) {
  return request(createTestApp()).get("/api/auth/me").set("Cookie", `token=${token}`);
}

beforeEach(resetDb);

afterEach(() => {
  vi.useRealTimers();
});

describe("POST /api/auth/register", () => {
  it("creates the user with a lowercased email and sets the session cookie", async () => {
    const res = await request(createTestApp()).post("/api/auth/register").send(credentials);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ user: { id: expect.any(String), email: "alice@example.com" } });

    const cookie = tokenCookie(res);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Lax/);
    expect(cookie).toMatch(/Path=\//);
    expect(cookie).toMatch(/Max-Age=604800/);
  });

  it("marks the session cookie Secure when secure cookies are enabled", async () => {
    const app = createApp({ db: testDb, jwtSecret: TEST_JWT_SECRET, secureCookies: true });

    const res = await request(app).post("/api/auth/register").send(credentials);

    expect(res.status).toBe(201);
    expect(tokenCookie(res)).toMatch(/; Secure/);
  });

  it("rejects an email that is already registered, ignoring case", async () => {
    await register();

    const res = await request(createTestApp())
      .post("/api/auth/register")
      .send({ ...credentials, email: "ALICE@example.com" });

    expect(res.status).toBe(409);
    expect(errorCode(res)).toBe("EMAIL_TAKEN");
  });

});

describe("POST /api/auth/login", () => {
  it("signs in with the email in any case", async () => {
    const { user } = await register();

    const res = await request(createTestApp())
      .post("/api/auth/login")
      .send({ ...credentials, email: "  ALICE@EXAMPLE.COM " });

    expect(res.status).toBe(200);
    expect(userResponseSchema.parse(res.body).user).toEqual(user);
    expect((await me(tokenFrom(tokenCookie(res)))).status).toBe(200);
  });

  it("gives the same error for a wrong password and an unknown email", async () => {
    await register();
    const app = createTestApp();

    const wrongPassword = await request(app)
      .post("/api/auth/login")
      .send({ ...credentials, password: "wrong password" });

    const unknownEmail = await request(app)
      .post("/api/auth/login")
      .send({ ...credentials, email: "bob@example.com" });

    for (const res of [wrongPassword, unknownEmail]) {
      expect(res.status).toBe(401);
      expect(errorCode(res)).toBe("INVALID_CREDENTIALS");
      expect(tokenCookie(res)).toBeUndefined();
    }

    expect(unknownEmail.body).toEqual(wrongPassword.body);
  });

  it("rate-limits repeated attempts", async () => {
    const app = createTestApp();
    const attempt = () => request(app).post("/api/auth/login").send(credentials);

    for (let i = 0; i < AUTH_RATE_LIMIT.limit; i++) expect((await attempt()).status).toBe(401);

    const res = await attempt();
    expect(res.status).toBe(429);
    expect(errorCode(res)).toBe("RATE_LIMITED");
  });
});

describe("POST /api/auth/logout", () => {
  it("clears the session cookie", async () => {
    const agent = request.agent(createTestApp());
    await agent.post("/api/auth/register").send(credentials);

    const res = await agent.post("/api/auth/logout");

    expect(res.status).toBe(204);
    expect((await agent.get("/api/auth/me")).status).toBe(401);
  });
});

describe("requireAuth", () => {
  it("rejects a request without a cookie", async () => {
    const res = await request(createTestApp()).get("/api/auth/me");

    expect(res.status).toBe(401);
    expect(errorCode(res)).toBe("UNAUTHENTICATED");
  });

  it("rejects a token signed with another secret", async () => {
    const { user } = await register();

    const forged = await new SignJWT()
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(user.id)
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(new TextEncoder().encode("another-secret-that-is-at-least-32-chars"));

    const res = await me(forged);

    expect(res.status).toBe(401);
    expect(errorCode(res)).toBe("UNAUTHENTICATED");
  });

  it("rejects an expired token", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const { token } = await register();

    vi.setSystemTime(Date.now() + 7 * DAY_MS + 1000);
    const res = await me(token);

    expect(res.status).toBe(401);
    expect(errorCode(res)).toBe("UNAUTHENTICATED");
  });

  it("rejects the token of a user that no longer exists", async () => {
    const { token } = await register();
    await testDb.delete(users);

    const res = await me(token);

    expect(res.status).toBe(401);
    expect(errorCode(res)).toBe("UNAUTHENTICATED");
  });

  it("re-issues a session older than 3.5 days", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const { token } = await register();
    const renewedAt = Date.now() + 4 * DAY_MS;

    vi.setSystemTime(renewedAt);
    const res = await me(token);

    expect(res.status).toBe(200);

    const renewed = decodeJwt(tokenFrom(tokenCookie(res)));
    expect(renewed.iat).toBe(Math.floor(renewedAt / 1000));
    expect(renewed.exp).toBe(Math.floor(renewedAt / 1000) + 7 * DAY_MS / 1000);
  });
});
