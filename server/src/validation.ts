import type { Request } from "express";
import type { z } from "zod";
import { AppError } from "./errors";

/** Parses the request body with a shared schema, throwing VALIDATION_ERROR with one detail per issue. */
export function parseBody<T extends z.ZodType>(req: Request, schema: T): z.output<T> {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const details = result.error.issues.map((issue) =>
      issue.path.length > 0 ? `${issue.path.join(".")}: ${issue.message}` : issue.message,
    );

    throw new AppError("VALIDATION_ERROR", "Invalid request body", details);
  }

  return result.data;
}
