import type { HealthResponse } from "@location-manager/shared";
import cookieParser from "cookie-parser";
import express from "express";
import type { Db } from "./db";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { createAuthRouter } from "./routes/auth";
import { createSessions } from "./services/session";

export interface AppDeps {
  db: Db;
  jwtSecret: string;
  /** Adds `Secure` to the session cookie; true in production (HTTPS). */
  secureCookies: boolean;
}

export function createApp(deps: AppDeps) {
  const sessions = createSessions({ jwtSecret: deps.jwtSecret, secureCookies: deps.secureCookies });

  const app = express();
  app.disable("x-powered-by");
  app.use(express.json());
  app.use(cookieParser());

  app.get("/api/health", (_req, res) => {
    const body: HealthResponse = { ok: true };
    res.json(body);
  });

  app.use("/api/auth", createAuthRouter(deps.db, sessions));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
