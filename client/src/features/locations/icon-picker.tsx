import { Popover } from "@cloudflare/kumo/primitives/popover";
import type { LocationIcon } from "@location-manager/shared";
import { useState } from "react";
import { PLACE_ICON_KEYS, PLACE_ICONS } from "./place-icons";

interface IconPickerProps {
  icon: LocationIcon;
  /** The icon was suggested from the name, not picked. */
  suggested: boolean;
  onPick: (icon: LocationIcon) => void;
}

/** The composer's 44px icon button, opening a 4×3 grid of icons (DESIGN.md: Icon picker). Esc closes it. */
export function IconPicker({ icon, suggested, onPick }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [pointed, setPointed] = useState<LocationIcon | null>(null);
  const { label, component: Current } = PLACE_ICONS[icon];

  function pick(next: LocationIcon) {
    onPick(next);
    setOpen(false);
  }

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        setPointed(null);
      }}
    >
      <Popover.Trigger
        aria-label={`Icon: ${label}${suggested ? ", suggested from the name" : ""}. Change icon`}
        className="relative flex size-(--tap) items-center justify-center rounded-md bg-accent-wash text-accent transition-colors duration-[120ms] hover:bg-[#ecd5ca] active:translate-y-px"
      >
        <Current size={22} aria-hidden />
        {suggested && (
          <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-[3px] bg-ink px-1 font-mono text-[9px] leading-3 tracking-[0.06em] text-chrome">
            AUTO
          </span>
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="start" sideOffset={8} className="z-50">
          <Popover.Popup aria-label="Choose an icon" className="rounded-[10px] border border-rule bg-field p-2 shadow-float transition-opacity duration-[120ms] data-ending-style:opacity-0 data-starting-style:opacity-0">
            <div aria-hidden className="caps h-6 px-1 pt-0.5">
              {PLACE_ICONS[pointed ?? icon].label}
            </div>
            <div className="grid grid-cols-4 gap-1">
              {PLACE_ICON_KEYS.map((key) => {
                const { label: keyLabel, component: IconComponent } = PLACE_ICONS[key];
                const chosen = key === icon;

                return (
                  <button
                    key={key}
                    type="button"
                    aria-label={keyLabel}
                    aria-pressed={chosen}
                    onClick={() => pick(key)}
                    onPointerEnter={() => setPointed(key)}
                    onPointerLeave={() => setPointed(null)}
                    onFocus={() => setPointed(key)}
                    className={`flex size-(--tap) items-center justify-center rounded-md transition-colors duration-[120ms] active:translate-y-px ${chosen ? "bg-accent-wash text-accent" : "text-ink hover:bg-hover"}`}
                  >
                    <IconComponent size={22} weight={chosen ? "fill" : "regular"} aria-hidden />
                  </button>
                );
              })}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
