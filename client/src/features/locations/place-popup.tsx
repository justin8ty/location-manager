import type { Location } from "@location-manager/shared";
import { CheckIcon, CopyIcon, type Icon, PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { formatAddedTime, formatCoordinates } from "./format";
import { PLACE_ICONS } from "./place-icons";

const COPIED_MS = 1200;

/** What a place's popup can do besides copying its coordinates. */
export interface PlaceActions {
  onEdit: (location: Location) => void;
  onDelete: (location: Location) => void;
}

interface PopupButtonProps {
  icon: Icon;
  label: string;
  onClick: () => void;
  tone?: "default" | "accent";
}

function PopupButton({ icon: IconComponent, label, onClick, tone = "default" }: PopupButtonProps) {
  const color = tone === "accent" ? "text-accent hover:bg-accent-wash" : "text-ink hover:bg-hover";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-(--tap) flex-1 items-center justify-center gap-1.5 text-meta font-medium transition-colors duration-[120ms] active:translate-y-px ${color}`}
    >
      <IconComponent size={16} aria-hidden />
      {label}
    </button>
  );
}

function useCopied(): [boolean, () => void] {
  const [copiedAt, setCopiedAt] = useState<number | null>(null);

  useEffect(() => {
    if (copiedAt === null) return;

    const timer = window.setTimeout(() => setCopiedAt(null), COPIED_MS);

    return () => window.clearTimeout(timer);
  }, [copiedAt]);

  return [copiedAt !== null, () => setCopiedAt(Date.now())];
}

interface PlacePopupProps {
  location: Location;
  /** Absent where places can't be changed, e.g. on the import page. */
  actions?: PlaceActions;
}

export function PlacePopup({ location, actions }: PlacePopupProps) {
  const { label, component: IconComponent } = PLACE_ICONS[location.icon];
  const [copied, markCopied] = useCopied();

  async function copy() {
    await navigator.clipboard.writeText(`${location.latitude}, ${location.longitude}`);
    markCopied();
  }

  return (
    <div className="w-[278px]">
      <div className="flex gap-3 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-[9px] bg-accent text-white">
          <IconComponent size={20} weight="fill" aria-hidden />
        </div>
        <div className="flex min-w-0 flex-col">
          <h2 className="text-heading break-words text-ink">{location.name}</h2>
          <div className="coords text-small text-ink-2">{formatCoordinates(location.latitude, location.longitude, 5)}</div>
          <div className="mt-0.5 text-meta text-ink-2">
            {label} · {formatAddedTime(location.createdAt)}
          </div>
        </div>
      </div>
      <div className="flex divide-x divide-rule overflow-hidden rounded-b-[9px] border-t border-rule">
        {actions && <PopupButton icon={PencilSimpleIcon} label="Edit" onClick={() => actions.onEdit(location)} />}
        <PopupButton icon={copied ? CheckIcon : CopyIcon} label={copied ? "Copied" : "Copy"} onClick={() => void copy()} />
        {actions && (
          <PopupButton icon={TrashIcon} label="Delete" tone="accent" onClick={() => actions.onDelete(location)} />
        )}
      </div>
    </div>
  );
}
