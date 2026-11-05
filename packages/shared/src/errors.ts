import { z } from "zod";

export const errorCodes = [
  "VALIDATION_ERROR",
  "UNAUTHENTICATED",
  "INVALID_CREDENTIALS",
  "EMAIL_TAKEN",
  "NOT_FOUND",
  "FILE_REQUIRED",
  "NOT_ZIP",
  "FILE_TOO_LARGE",
  "INVALID_ZIP_CONTENTS",
  "NOT_UTF8",
  "INVALID_ROWS",
  "NO_LOCATIONS",
  "RATE_LIMITED",
  "INTERNAL_ERROR",
] as const;

export const errorCodeSchema = z.enum(errorCodes);

export type ErrorCode = z.infer<typeof errorCodeSchema>;

export const apiErrorResponseSchema = z.object({
  error: z.object({
    code: errorCodeSchema,
    message: z.string(),
    details: z.array(z.string()).optional(),
  }),
});

export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;
