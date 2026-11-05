import { Banner, Button, Dialog } from "@cloudflare/kumo";
import type { Location } from "@location-manager/shared";
import { WarningCircleIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { useDeleteLocation } from "./queries";

interface DeleteLocationDialogProps {
  /** The location to confirm deleting; null closes the dialog. */
  location: Location | null;
  onClose: () => void;
}

export function DeleteLocationDialog({ location, onClose }: DeleteLocationDialogProps) {
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

    deletion.mutate(shown.id, { onSuccess: () => handleOpenChange(false) });
  }

  return (
    <Dialog.Root open={location !== null} onOpenChange={handleOpenChange}>
      <Dialog size="sm" className="flex flex-col gap-2 p-6">
        <Dialog.Title className="text-xl font-semibold text-kumo-default">Delete location?</Dialog.Title>
        <Dialog.Description className="text-kumo-subtle">
          <span className="font-medium break-words text-kumo-default">{shown?.name}</span> will be removed from your
          map. This can't be undone.
        </Dialog.Description>

        {deletion.error && (
          <Banner
            variant="error"
            size="sm"
            className="mt-2"
            icon={<WarningCircleIcon weight="fill" />}
            description={deletion.error.message}
          />
        )}

        <div className="mt-4 flex justify-end gap-2">
          <Dialog.Close render={(props) => <Button {...props}>Cancel</Button>} />
          <Button variant="destructive" loading={deletion.isPending} onClick={confirm}>
            Delete
          </Button>
        </div>
      </Dialog>
    </Dialog.Root>
  );
}
