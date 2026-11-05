import type { Request, RequestHandler } from "express";
import { AppError } from "../errors";
import type { Sessions } from "../services/session";

declare global {
  namespace Express {
    interface Request {
      /** Set by `requireAuth`; read it with `authenticatedUserId`. */
      userId?: string;
    }
  }
}

/** Rejects requests without a valid session with UNAUTHENTICATED and sets `req.userId`. */
export function requireAuth(sessions: Sessions): RequestHandler {
  return async (req, res, next) => {
    const userId = await sessions.authenticate(req, res);

    if (userId === null) throw new AppError("UNAUTHENTICATED", "Please log in to continue");

    req.userId = userId;
    next();
  };
}

/** The verified user id on a route guarded by `requireAuth`. */
export function authenticatedUserId(req: Request): string {
  if (req.userId === undefined) throw new Error("authenticatedUserId used on a route without requireAuth");

  return req.userId;
}
