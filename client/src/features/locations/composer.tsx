import type { Location } from "@location-manager/shared";
import { CheckIcon, PlusIcon } from "@phosphor-icons/react";
import { type FormEvent, type Ref, useState } from "react";
import { Button } from "../../components/button";
import { TextField } from "../../components/text-field";
import { IconPicker } from "./icon-picker";
import { type DraftErrors, draftErrors, type LocationDraft, locationChanges, parseDraft, renameDraft } from "./location-draft";
import { useCreateLocation, useUpdateLocation } from "./queries";

/** How the map fills in coordinates: clicking it (desktop), or panning it under the crosshair (phones). */
export type PickMethod = "click" | "add-here";

const HINTS: Record<PickMethod, { adding: string; editing: string }> = {
  click: { adding: "or click the map", editing: "click the map to move" },
  "add-here": { adding: "or pan and tap Add here", editing: "pan and tap Add here to move" },
};

const ERROR_ID = "composer-error";

interface ComposerProps {
  draft: LocationDraft;
  onDraftChange: (draft: LocationDraft) => void;
  /** The place being edited, or null to add a new one. */
  editing: Location | null;
  /** Called with the place that was added or updated. */
  onSaved: (location: Location) => void;
  onCancelEdit: () => void;
  pickMethod: PickMethod;
  nameInputRef: Ref<HTMLInputElement>;
}

function ModeLabel({ editing, pickMethod }: { editing: Location | null; pickMethod: PickMethod }) {
  const hint = editing ? HINTS[pickMethod].editing : HINTS[pickMethod].adding;

  return (
    <div className="col-span-3 flex min-w-0 items-baseline justify-between gap-3">
      <span className="caps flex min-w-0 gap-1.5">
        {editing ? (
          <>
            <span className="shrink-0">Editing ·</span>
            <span className="truncate text-accent">{editing.name}</span>
          </>
        ) : (
          "New place"
        )}
      </span>
      <span className="shrink-0 text-small text-ink-2">{hint}</span>
    </div>
  );
}

/**
 * Adds a place, or edits one (DESIGN.md: Composer). The draft is owned by the page, so the map can fill
 * in coordinates in either mode. Its height is fixed, so modes and errors never move what's below.
 */
export function Composer(props: ComposerProps) {
  const { draft, editing } = props;
  const creation = useCreateLocation();
  const update = useUpdateLocation();
  // Errors appear after the first submit, then track the fields as they're corrected (typed or picked).
  const [submitted, setSubmitted] = useState(false);
  const errors: DraftErrors = submitted ? draftErrors(draft) : {};
  const saving = creation.isPending || update.isPending;
  const requestError = editing ? update.error : creation.error;
  const message = errors.name ?? errors.latitude ?? errors.longitude ?? requestError?.message;

  function setCoordinate(field: "latitude" | "longitude", value: string) {
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

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      aria-label={editing ? `Edit ${editing.name}` : "Add a place"}
      className="grid h-[282px] shrink-0 grid-cols-[44px_1fr_1.25fr] content-between gap-x-2.5 rounded-[10px] border border-rule bg-field p-4"
    >
      <ModeLabel editing={editing} pickMethod={props.pickMethod} />

      <div className="flex flex-col gap-1">
        <span className="caps" aria-hidden>
          Icon
        </span>
        <IconPicker
          icon={draft.icon}
          suggested={draft.iconSuggested}
          onPick={(icon) => props.onDraftChange({ ...draft, icon, iconSuggested: false })}
        />
      </div>
      <TextField
        ref={props.nameInputRef}
        label="Name"
        placeholder="Suria KLCC"
        autoComplete="off"
        maxLength={100}
        className="col-span-2"
        value={draft.name}
        onChange={(event) => props.onDraftChange(renameDraft(draft, event.target.value))}
        invalid={errors.name !== undefined}
        aria-describedby={ERROR_ID}
      />

      <TextField
        label="Latitude"
        placeholder="3.157324"
        autoComplete="off"
        inputMode="decimal"
        spellCheck={false}
        mono
        className="col-span-2"
        value={draft.latitude}
        onChange={(event) => setCoordinate("latitude", event.target.value)}
        invalid={errors.latitude !== undefined}
        aria-describedby={ERROR_ID}
      />
      <TextField
        label="Longitude"
        placeholder="101.712198"
        autoComplete="off"
        inputMode="decimal"
        spellCheck={false}
        mono
        value={draft.longitude}
        onChange={(event) => setCoordinate("longitude", event.target.value)}
        invalid={errors.longitude !== undefined}
        aria-describedby={ERROR_ID}
      />

      <p id={ERROR_ID} aria-live="polite" className="col-span-3 h-[18px] truncate text-meta text-accent">
        {message}
      </p>

      <div className="col-span-3 flex gap-2">
        {editing ? (
          <>
            <Button type="submit" variant="primary" icon={CheckIcon} loading={saving} className="flex-1">
              Save
            </Button>
            <Button onClick={props.onCancelEdit} disabled={saving}>
              Cancel
            </Button>
          </>
        ) : (
          <Button type="submit" variant="primary" icon={PlusIcon} loading={saving} className="flex-1">
            Add place
          </Button>
        )}
      </div>
    </form>
  );
}
