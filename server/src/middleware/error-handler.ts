import type { ApiErrorResponse } from "@location-manager/shared";
import type { ErrorRequestHandler, RequestHandler } from "express";
import { z } from "zod";
import { AppError } from "../errors";

// Client errors raised by Express's body parsers (malformed JSON, oversized body, bad charset).
const exposedClientErrorSchema = z.object({
  expose: z.literal(true),
  status: z.number().int().min(400).max(499),
  message: z.string(),
});

export const notFoundHandler: RequestHandler = (req) => {
  throw new AppError("NOT_FOUND", `Route ${req.method} ${req.path} not found`);
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  let appError: AppError;

  if (err instanceof AppError) {
    appError = err;
  } else {
    const clientError = exposedClientErrorSchema.safeParse(err);

    if (clientError.success) {
      appError = new AppError("VALIDATION_ERROR", clientError.data.message);
    } else {
      console.error(err);
      appError = new AppError("INTERNAL_ERROR", "Something went wrong");
    }
  }

  const body: ApiErrorResponse = {
    error: { code: appError.code, message: appError.message, details: appError.details },
  };

  res.status(appError.status).json(body);
};
