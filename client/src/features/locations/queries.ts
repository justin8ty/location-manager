import {
  type CreateLocationRequest,
  locationResponseSchema,
  locationsResponseSchema,
  type UpdateLocationRequest,
} from "@location-manager/shared";
import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError, apiRequest, apiRequestNoContent } from "../../lib/api";

/** The signed-in user's locations, oldest first. */
export const locationsQuery = queryOptions({
  queryKey: ["locations"],
  queryFn: async () => (await apiRequest("GET", "/locations", locationsResponseSchema)).locations,
  // Kept current by create and delete; an upload invalidates it to load the new rows.
  staleTime: Number.POSITIVE_INFINITY,
});

export function useCreateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateLocationRequest) =>
      (await apiRequest("POST", "/locations", locationResponseSchema, input)).location,
    onSuccess: (location) =>
      queryClient.setQueryData(locationsQuery.queryKey, (locations) => locations?.concat(location)),
  });
}

interface LocationUpdate {
  id: string;
  changes: UpdateLocationRequest;
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, changes }: LocationUpdate) =>
      (await apiRequest("PATCH", `/locations/${id}`, locationResponseSchema, changes)).location,
    onSuccess: (updated) =>
      queryClient.setQueryData(locationsQuery.queryKey, (locations) =>
        locations?.map((location) => (location.id === updated.id ? updated : location)),
      ),
  });
}

export function useDeleteLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await apiRequestNoContent("DELETE", `/locations/${id}`);
      } catch (error) {
        // Already gone (e.g. deleted in another tab) is the outcome delete wants.
        if (!(error instanceof ApiError && error.code === "NOT_FOUND")) throw error;
      }
    },
    onSuccess: (_, id) =>
      queryClient.setQueryData(locationsQuery.queryKey, (locations) =>
        locations?.filter((location) => location.id !== id),
      ),
  });
}
