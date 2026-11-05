import type { ErrorCode } from "@location-manager/shared";

const statusByCode = {
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
  INVALID_CREDENTIALS: 401,
  EMAIL_TAKEN: 409,
  NOT_FOUND: 404,
  FILE_REQUIRED: 400,
  NOT_ZIP: 400,
  FILE_TOO_LARGE: 413,
  INVALID_ZIP_CONTENTS: 400,
  NOT_UTF8: 400,
  INVALID_ROWS: 400,
  NO_LOCATIONS: 400,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
} satisfies Record<ErrorCode, number>;

/** An expected failure, sent to the client as the API error body with the status for its code. */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details: string[] | undefined;

  constructor(code: ErrorCode, message: string, details?: string[]) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = statusByCode[code];
    this.details = details;
  }
}
