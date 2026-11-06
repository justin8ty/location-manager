import { Toast } from "@cloudflare/kumo/primitives/toast";
import { type Location, uploadResponseSchema } from "@location-manager/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { apiRequest, isUnauthenticated } from "../../lib/api";
import { formatPlaceCount } from "../locations/format";
import { updateCachedLocations } from "../locations/queries";

/** Upload results are toasted for 3 seconds (SPEC: File Upload). */
export const UPLOAD_TOAST_MS = 3000;

interface ZipImportOptions {
  /** Whether the success toast offers a way to the map (pointless on the map itself). */
  offerViewOnMap: boolean;
  /** Called with the imported places once they're in the locations cache. */
  onImported: (locations: Location[]) => void;
}

/**
 * Imports places from a ZIP file. The new places are added straight to the cached list, so their pins
 * drop onto any map showing it. Success and failure each show a 3-second toast.
 */
export function useZipImport({ offerViewOnMap, onImported }: ZipImportOptions) {
  const queryClient = useQueryClient();
  const toasts = Toast.useToastManager();
  const navigate = useNavigate();

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const body = new FormData();
      body.append("file", file);

      return apiRequest("POST", "/locations/upload", uploadResponseSchema, body);
    },
    onSuccess: ({ count, locations }, file) => {
      updateCachedLocations(queryClient, (current) => current.concat(locations));
      onImported(locations);

      const toastId: string = toasts.add({
        type: "success",
        title: `Added ${formatPlaceCount(count)}`,
        description: `from ${file.name}`,
        timeout: UPLOAD_TOAST_MS,
        actionProps: offerViewOnMap
          ? {
              children: "View on map",
              onClick: () => {
                toasts.close(toastId);
                void navigate({ to: "/map" });
              },
            }
          : undefined,
      });
    },
    onError: (error) => {
      // An expired session redirects to login instead.
      if (isUnauthenticated(error)) return;

      toasts.add({ type: "error", title: "Import failed", description: error.message, timeout: UPLOAD_TOAST_MS });
    },
  });

  /** Imports a dropped or chosen file; only one may be given at a time. */
  function importFiles(files: FileList) {
    const [file] = files;

    if (!file) return;

    if (files.length > 1) {
      toasts.add({ type: "error", title: "Import one ZIP file at a time", timeout: UPLOAD_TOAST_MS });

      return;
    }

    upload.mutate(file);
  }

  return { upload, importFiles };
}
