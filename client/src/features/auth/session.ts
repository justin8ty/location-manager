import {
  type LoginRequest,
  type RegisterRequest,
  type User,
  userResponseSchema,
} from "@location-manager/shared";
import { type QueryClient, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ApiError, apiRequest, apiRequestNoContent, isUnauthenticated } from "../../lib/api";

const DEFAULT_REDIRECT_PATH = "/map";

/** The signed-in user, or null when there is no valid session. */
export const currentUserQuery = queryOptions({
  queryKey: ["auth", "me"],
  queryFn: async (): Promise<User | null> => {
    try {
      const { user } = await apiRequest("GET", "/auth/me", userResponseSchema);

      return user;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return null;

      throw error;
    }
  },
  // Kept current by login, register, logout and the global 401 handler instead of refetching.
  staleTime: Number.POSITIVE_INFINITY,
});

/** Forgets the signed-in user and every cached response that belonged to them. */
export function clearSession(queryClient: QueryClient) {
  queryClient.clear();
  queryClient.setQueryData(currentUserQuery.queryKey, null);
}

/**
 * Where to go after logging in. Only same-origin paths are followed,
 * so a crafted `?redirect=` link can't send the user to another site.
 */
export function postLoginPath(redirect: string | undefined): string {
  if (redirect === undefined) return DEFAULT_REDIRECT_PATH;

  const url = new URL(redirect, window.location.origin);

  if (url.origin !== window.location.origin) return DEFAULT_REDIRECT_PATH;

  return `${url.pathname}${url.search}${url.hash}`;
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: LoginRequest) =>
      (await apiRequest("POST", "/auth/login", userResponseSchema, credentials)).user,
    onSuccess: (user) => queryClient.setQueryData(currentUserQuery.queryKey, user),
  });
}

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: RegisterRequest) =>
      (await apiRequest("POST", "/auth/register", userResponseSchema, credentials)).user,
    onSuccess: (user) => queryClient.setQueryData(currentUserQuery.queryKey, user),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async () => {
      try {
        await apiRequestNoContent("POST", "/auth/logout");
      } catch (error) {
        // An already-ended session is the outcome logout wants.
        if (!(error instanceof Error && isUnauthenticated(error))) throw error;
      }
    },
    onSuccess: async () => {
      // Cleared first, so the login page's guard sees no user.
      clearSession(queryClient);
      await navigate({ to: "/login" });
    },
  });
}
