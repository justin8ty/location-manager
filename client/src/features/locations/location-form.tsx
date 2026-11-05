import { Banner, Button, Input } from "@cloudflare/kumo";
import type { Location } from "@location-manager/shared";
import { PlusIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { type FormEvent, type Ref, useState } from "react";
import { type DraftErrors, draftErrors, EMPTY_DRAFT, type LocationDraft, parseDraft } from "./location-draft";
import { useCreateLocation } from "./queries";

interface LocationFormProps {
  draft: LocationDraft;
  onDraftChange: (draft: LocationDraft) => void;
  onCreated: (location: Location) => void;
  nameInputRef: Ref<HTMLInputElement>;
}

/** Adds a location. The draft is owned by the page, so clicking the map can fill in coordinates. */
export function LocationForm({ draft, onDraftChange, onCreated, nameInputRef }: LocationFormProps) {
  const creation = useCreateLocation();
  // Errors appear after the first submit, then track the fields as they are corrected (typed or picked).
  const [submitted, setSubmitted] = useState(false);
  const errors: DraftErrors = submitted ? draftErrors(draft) : {};
  const isEmpty = draft.name === "" && draft.latitude === "" && draft.longitude === "";

  function update(field: keyof LocationDraft, value: string) {
    onDraftChange({ ...draft, [field]: value });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    const result = parseDraft(draft);

    if (!result.success) return;

    creation.mutate(result.data, {
      onSuccess: (location) => {
        setSubmitted(false);
        onCreated(location);
      },
    });
  }

  function clear() {
    setSubmitted(false);
    creation.reset();
    onDraftChange(EMPTY_DRAFT);
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
      {creation.error && (
        <Banner
          variant="error"
          size="sm"
          icon={<WarningCircleIcon weight="fill" />}
          description={creation.error.message}
        />
      )}

      <Input
        ref={nameInputRef}
        label="Name"
        placeholder="Suria KLCC"
        autoComplete="off"
        value={draft.name}
        onValueChange={(value) => update("name", value)}
        error={errors.name}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Latitude"
          placeholder="3.157324"
          autoComplete="off"
          spellCheck={false}
          className="w-full tabular-nums"
          value={draft.latitude}
          onValueChange={(value) => update("latitude", value)}
          error={errors.latitude}
        />
        <Input
          label="Longitude"
          placeholder="101.712198"
          autoComplete="off"
          spellCheck={false}
          className="w-full tabular-nums"
          value={draft.longitude}
          onValueChange={(value) => update("longitude", value)}
          error={errors.longitude}
        />
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" variant="primary" icon={PlusIcon} loading={creation.isPending}>
          Add
        </Button>
        {!isEmpty && (
          <Button variant="ghost" onClick={clear} disabled={creation.isPending}>
            Clear
          </Button>
        )}
      </div>
    </form>
  );
}
