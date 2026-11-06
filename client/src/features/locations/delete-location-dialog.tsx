import { AlertDialog } from "@cloudflare/kumo/primitives/alert-dialog";
import type { Location } from "@location-manager/shared";
import { useState } from "react";
import { Button } from "../../components/button";
import { useDeleteLocation } from "./queries";

interface DeleteLocationDialogProps {
  /** The place to confirm deleting; null closes the dialog. */
  location: Location | null;
  onClose: () => void;
  onDeleted: (location: Location) => void;
}

export function DeleteLocationDialog({ location, onClose, onDeleted }: DeleteLocationDialogProps) {
  const deletion = useDeleteLocation();
  // Keeps the name on screen while the dialog animates out after `location` becomes null.
  const [shown, setShown] = useState(location);

  if (location && location !== shown) setShown(location);

  function handleOpenChange(open: boolean) {
    if (open) return;

    deletion.reset();
    onClose();
  }

  function confirm() {
    if (!shown) return;

    const deleted = shown;
    deletion.mutate(deleted.id, {
      onSuccess: () => {
        handleOpenChange(false);
        onDeleted(deleted);
      },
    });
  }

  return (
    <AlertDialog.Root open={location !== null} onOpenChange={handleOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-[rgb(31_28_24/.35)] transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <AlertDialog.Popup className="fixed top-1/2 left-1/2 z-50 flex w-[min(400px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 flex-col gap-2 rounded-[10px] border border-rule bg-field p-5 shadow-float transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0">
          <AlertDialog.Title className="text-heading text-ink">Delete place?</AlertDialog.Title>
          <AlertDialog.Description className="break-words text-ink-2">
            <strong className="font-medium text-ink">{shown?.name}</strong> will be removed from your map.
          </AlertDialog.Description>
          <p aria-live="polite" className="min-h-[18px] text-meta text-accent">
            {deletion.error?.message}
          </p>
          <div className="flex justify-end gap-2">
            <AlertDialog.Close render={<Button />}>Cancel</AlertDialog.Close>
            <Button variant="primary" loading={deletion.isPending} onClick={confirm}>
              Delete
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
