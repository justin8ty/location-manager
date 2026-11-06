import {
  type CreateLocationRequest,
  type Location,
  locationResponseSchema,
  locationsResponseSchema,
  type UpdateLocationRequest,
} from "@location-manager/shared";
import { type QueryClient, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError, apiRequest, apiRequestNoContent } from "../../lib/api";

/** The signed-in user's locations, oldest first. */
export const locationsQuery = queryOptions({
  queryKey: ["locations"],
  queryFn: async () => (await apiRequest("GET", "/locations", locationsResponseSchema)).locations,
  // Kept current by create, update, delete and import, which all write their results into it.
  staleTime: Number.POSITIVE_INFINITY,
});

/**
 * Applies a change to the cached list. Before the list has loaded there is nothing to change, and the
 * load may have started before the change was saved, so the list is fetched again instead.
 */
export function updateCachedLocations(queryClient: QueryClient, update: (locations: Location[]) => Location[]) {
  if (queryClient.getQueryData(locationsQuery.queryKey) === undefined) {
    void queryClient.invalidateQueries(locationsQuery);

    return;
  }

  queryClient.setQueryData(locationsQuery.queryKey, (locations) => locations && update(locations));
}

export function useCreateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateLocationRequest) =>
      (await apiRequest("POST", "/locations", locationResponseSchema, input)).location,
    onSuccess: (location) => updateCachedLocations(queryClient, (locations) => locations.concat(location)),
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
      updateCachedLocations(queryClient, (locations) =>
        locations.map((location) => (location.id === updated.id ? updated : location)),
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
      updateCachedLocations(queryClient, (locations) => locations.filter((location) => location.id !== id)),
  });
}
