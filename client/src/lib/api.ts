import {
  apiErrorResponseSchema,
  type CreateLocationRequest,
  type ErrorCode,
  type LoginRequest,
  type RegisterRequest,
  type UpdateLocationRequest,
} from "@location-manager/shared";
import type { z } from "zod";

type Method = "GET" | "POST" | "PATCH" | "DELETE";

type RequestBody = RegisterRequest | LoginRequest | CreateLocationRequest | UpdateLocationRequest | FormData;

/** An error response from the API, carrying the server's error code and details. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly details: string[];

  constructor(status: number, code: ErrorCode, message: string, details: string[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/** The session is missing or expired; any other 401 (e.g. wrong password) is a normal failure. */
export function isUnauthenticated(error: Error): boolean {
  return error instanceof ApiError && error.code === "UNAUTHENTICATED";
}

function requestInit(method: Method, body: RequestBody | undefined): RequestInit {
  if (body === undefined) return { method };

  if (body instanceof FormData) return { method, body };

  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

async function toApiError(response: Response): Promise<ApiError> {
  const parsed = apiErrorResponseSchema.safeParse(await response.json().catch(() => null));

  if (parsed.success) {
    const { code, message, details } = parsed.data.error;

    return new ApiError(response.status, code, message, details);
  }

  // Not from our API, e.g. the proxy failing to reach the server.
  return new ApiError(response.status, "INTERNAL_ERROR", `Server error (${response.status}). Please try again.`);
}

async function send(method: Method, path: string, body: RequestBody | undefined): Promise<Response> {
  let response: Response;

  try {
    response = await fetch(`/api${path}`, requestInit(method, body));
  } catch (cause) {
    throw new Error("Can't reach the server. Check your connection and try again.", { cause });
  }

  if (!response.ok) throw await toApiError(response);

  return response;
}

/** Calls the API and parses the JSON success body with `schema`. */
export async function apiRequest<T extends z.ZodType>(
  method: Method,
  path: string,
  schema: T,
  body?: RequestBody,
): Promise<z.output<T>> {
  const response = await send(method, path, body);

  return schema.parse(await response.json());
}

/** Calls an API endpoint that responds with no content (204). */
export async function apiRequestNoContent(method: Method, path: string, body?: RequestBody): Promise<void> {
  await send(method, path, body);
}
