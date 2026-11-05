import { AppError } from "../src/errors";

/** Runs `fn`, which must throw an AppError, and returns that error. */
export function appErrorFrom(fn: () => void): AppError {
  try {
    fn();
  } catch (error) {
    if (error instanceof AppError) return error;

    throw error;
  }

  throw new Error("Expected an AppError to be thrown");
}
