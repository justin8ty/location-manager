import { loginRequestSchema, registerRequestSchema, type UserResponse } from "@location-manager/shared";
import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import type { Db } from "../db";
import { AppError } from "../errors";
import { authenticatedUserId, requireAuth } from "../middleware/require-auth";
import { authenticateUser, findUser, registerUser } from "../services/auth";
import type { Sessions } from "../services/session";
import { parseBody } from "../validation";

export const AUTH_RATE_LIMIT = { windowMs: 15 * 60 * 1000, limit: 10 };

export function createAuthRouter(db: Db, sessions: Sessions) {
  const router = Router();

  const credentialsRateLimit = rateLimit({
    ...AUTH_RATE_LIMIT,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: () => {
      throw new AppError("RATE_LIMITED", "Too many attempts. Please try again later");
    },
  });

  router.post("/register", credentialsRateLimit, async (req, res) => {
    const user = await registerUser(db, parseBody(req, registerRequestSchema));
    await sessions.start(res, user.id);
    const body: UserResponse = { user };
    res.status(201).json(body);
  });

  router.post("/login", credentialsRateLimit, async (req, res) => {
    const user = await authenticateUser(db, parseBody(req, loginRequestSchema));
    await sessions.start(res, user.id);
    const body: UserResponse = { user };
    res.json(body);
  });

  router.post("/logout", requireAuth(sessions), (_req, res) => {
    sessions.end(res);
    res.status(204).end();
  });

  router.get("/me", requireAuth(sessions), async (req, res) => {
    const user = await findUser(db, authenticatedUserId(req));

    if (!user) {
      sessions.end(res);
      throw new AppError("UNAUTHENTICATED", "Please log in to continue");
    }

    const body: UserResponse = { user };
    res.json(body);
  });

  return router;
}
