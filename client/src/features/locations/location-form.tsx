import { Banner, Button, Input } from "@cloudflare/kumo";
import type { Location } from "@location-manager/shared";
import { CheckIcon, PlusIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { type FormEvent, type Ref, useState } from "react";
import {
  type DraftErrors,
  draftErrors,
  EMPTY_DRAFT,
  type LocationDraft,
  locationChanges,
  parseDraft,
} from "./location-draft";
import { useCreateLocation, useUpdateLocation } from "./queries";

interface LocationFormProps {
  draft: LocationDraft;
  onDraftChange: (draft: LocationDraft) => void;
  /** The location being edited, or null to add a new one. */
  editing: Location | null;
  /** Called with the location that was added or updated. */
  onSaved: (location: Location) => void;
  onCancelEdit: () => void;
  nameInputRef: Ref<HTMLInputElement>;
}

/**
 * Adds a location, or edits one. The draft is owned by the page, so clicking the map can fill in
 * coordinates in either mode. Key it by the edited location so switching resets errors.
 */
export function LocationForm(props: LocationFormProps) {
  const { draft, editing } = props;
  const creation = useCreateLocation();
  const update = useUpdateLocation();
  // Errors appear after the first submit, then track the fields as they are corrected (typed or picked).
  const [submitted, setSubmitted] = useState(false);
  const errors: DraftErrors = submitted ? draftErrors(draft) : {};
  const saving = creation.isPending || update.isPending;
  const requestError = editing ? update.error : creation.error;
  const isEmpty = draft.name === "" && draft.latitude === "" && draft.longitude === "";

  function setField(field: keyof LocationDraft, value: string) {
    props.onDraftChange({ ...draft, [field]: value });
  }

  function saved(location: Location) {
    setSubmitted(false);
    props.onSaved(location);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    const result = parseDraft(draft);

    if (!result.success) return;

    if (!editing) {
      creation.mutate(result.data, { onSuccess: saved });

      return;
    }

    const changes = locationChanges(editing, result.data);

    if (changes) update.mutate({ id: editing.id, changes }, { onSuccess: saved });
    else saved(editing);
  }

  function clear() {
    setSubmitted(false);
    creation.reset();
    props.onDraftChange(EMPTY_DRAFT);
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
      {requestError && (
        <Banner variant="error" size="sm" icon={<WarningCircleIcon weight="fill" />} description={requestError.message} />
      )}

      <Input
        ref={props.nameInputRef}
        label="Name"
        placeholder="Suria KLCC"
        autoComplete="off"
        value={draft.name}
        onValueChange={(value) => setField("name", value)}
        error={errors.name}
      />

      <div className="grid grid-cols-2 items-start gap-3">
        <Input
          label="Latitude"
          placeholder="3.157324"
          autoComplete="off"
          spellCheck={false}
          className="w-full tabular-nums"
          value={draft.latitude}
          onValueChange={(value) => setField("latitude", value)}
          error={errors.latitude}
        />
        <Input
          label="Longitude"
          placeholder="101.712198"
          autoComplete="off"
          spellCheck={false}
          className="w-full tabular-nums"
          value={draft.longitude}
          onValueChange={(value) => setField("longitude", value)}
          error={errors.longitude}
        />
      </div>

      <div className="flex items-center gap-2">
        {editing ? (
          <>
            <Button type="submit" variant="primary" icon={CheckIcon} loading={saving}>
              Save
            </Button>
            <Button variant="ghost" onClick={props.onCancelEdit} disabled={saving}>
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button type="submit" variant="primary" icon={PlusIcon} loading={saving}>
              Add
            </Button>
            {!isEmpty && (
              <Button variant="ghost" onClick={clear} disabled={saving}>
                Clear
              </Button>
            )}
          </>
        )}
      </div>
    </form>
  );
}
