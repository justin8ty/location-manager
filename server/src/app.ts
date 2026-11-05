import type { HealthResponse } from "@location-manager/shared";
import cookieParser from "cookie-parser";
import express from "express";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json());
  app.use(cookieParser());

  app.get("/api/health", (_req, res) => {
    const body: HealthResponse = { ok: true };
    res.json(body);
  });

  return app;
}
