import { useKumoToastManager } from "@cloudflare/kumo";
import { uploadResponseSchema } from "@location-manager/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { apiRequest, isUnauthenticated } from "../../lib/api";
import { formatLocationCount } from "../locations/format";
import { locationsQuery } from "../locations/queries";

export const UPLOAD_TOAST_MS = 3000;

/**
 * Uploads a ZIP of locations. Success and failure each show a 3-second toast; once the
 * success toast closes, the locations list is refetched so the new markers reach the map.
 */
export function useUploadLocations() {
  const queryClient = useQueryClient();
  const toasts = useKumoToastManager();
  const navigate = useNavigate();

  async function viewOnMap(toastId: string) {
    // An invalidated list makes the map wait for the new one, so it opens with the new markers in view.
    await queryClient.invalidateQueries(locationsQuery);
    toasts.close(toastId);
    await navigate({ to: "/map" });
  }

  return useMutation({
    mutationFn: async (file: File) => {
      const body = new FormData();
      body.append("file", file);

      return apiRequest("POST", "/locations/upload", uploadResponseSchema, body);
    },
    onSuccess: ({ count }) => {
      const toastId: string = toasts.add({
        variant: "success",
        title: `Added ${formatLocationCount(count)}`,
        timeout: UPLOAD_TOAST_MS,
        onClose: () => void queryClient.invalidateQueries(locationsQuery),
        actions: [{ children: "View on map", size: "sm", onClick: () => void viewOnMap(toastId) }],
      });
    },
    onError: (error) => {
      // An expired session redirects to login instead.
      if (isUnauthenticated(error)) return;

      toasts.add({ variant: "error", title: "Upload failed", description: error.message, timeout: UPLOAD_TOAST_MS });
    },
  });
}
