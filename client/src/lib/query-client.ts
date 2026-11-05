import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { ApiError, isUnauthenticated } from "./api";

const MAX_RETRIES = 2;

// Client errors (4xx) won't succeed on a retry; network and server errors might.
function shouldRetry(failureCount: number, error: Error): boolean {
  if (error instanceof ApiError && error.status < 500) return false;

  return failureCount < MAX_RETRIES;
}

/** A query client that calls `onUnauthenticated` whenever a request finds the session missing or expired. */
export function createQueryClient(onUnauthenticated: () => void): QueryClient {
  function handleError(error: Error) {
    if (isUnauthenticated(error)) onUnauthenticated();
  }

  return new QueryClient({
    queryCache: new QueryCache({ onError: handleError }),
    mutationCache: new MutationCache({ onError: handleError }),
    defaultOptions: {
      queries: { retry: shouldRetry },
      mutations: { retry: false },
    },
  });
}
