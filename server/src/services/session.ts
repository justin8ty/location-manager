import type { CookieOptions, Request, Response } from "express";
import { errors, jwtVerify, SignJWT } from "jose";
import { z } from "zod";

const COOKIE_NAME = "token";
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;
const RENEW_AFTER_SECONDS = SESSION_TTL_SECONDS / 2;

const cookieSchema = z.string().min(1);
const claimsSchema = z.object({ sub: z.uuid(), iat: z.number() });

type Claims = z.infer<typeof claimsSchema>;

export interface SessionConfig {
  jwtSecret: string;
  secureCookies: boolean;
}

/**
 * Sessions are 7-day HS256 JWTs in an httpOnly cookie, re-issued once they are
 * older than 3.5 days so active users stay signed in (SPEC ADR-5).
 */
export function createSessions(config: SessionConfig) {
  const key = new TextEncoder().encode(config.jwtSecret);

  const cookieOptions: CookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: config.secureCookies,
  };

  async function start(res: Response, userId: string) {
    const token = await new SignJWT()
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(userId)
      .setIssuedAt()
      .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
      .sign(key);

    res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: SESSION_TTL_SECONDS * 1000 });
  }

  function end(res: Response) {
    res.clearCookie(COOKIE_NAME, cookieOptions);
  }

  /** Verifies signature and expiry; null for any invalid, expired or malformed token. */
  async function verify(token: string): Promise<Claims | null> {
    try {
      const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
      const claims = claimsSchema.safeParse(payload);

      return claims.success ? claims.data : null;
    } catch (error) {
      if (error instanceof errors.JOSEError) return null;

      throw error;
    }
  }

  /** Returns the signed-in user's id, renewing an ageing session, or null if there is no valid session. */
  async function authenticate(req: Request, res: Response): Promise<string | null> {
    const token = cookieSchema.safeParse(req.cookies[COOKIE_NAME]);

    if (!token.success) return null;

    const claims = await verify(token.data);

    if (!claims) return null;

    const ageSeconds = Date.now() / 1000 - claims.iat;

    if (ageSeconds > RENEW_AFTER_SECONDS) await start(res, claims.sub);

    return claims.sub;
  }

  return { start, end, authenticate };
}

export type Sessions = ReturnType<typeof createSessions>;
