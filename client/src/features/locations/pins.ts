import type { LocationIcon } from "@location-manager/shared";
import { type DivIcon, divIcon } from "leaflet";
import { PLACE_ICONS } from "./place-icons";

const PIN_WIDTH = 34;
const PIN_HEIGHT = 44;
const CLUSTER_SIZE = 40;

// A teardrop whose tip sits on the coordinate. The 1.5px white outline keeps it legible on any background.
const TEARDROP = `<svg class="place-pin__shape" viewBox="0 0 ${PIN_WIDTH} ${PIN_HEIGHT}" width="${PIN_WIDTH}" height="${PIN_HEIGHT}" aria-hidden="true"><path d="M17 43.1S1 28.6 1 17a16 16 0 0 1 32 0c0 11.6-16 26.1-16 26.1Z"/></svg>`;

const HTML_ESCAPES = new Map([
  ["&", "&amp;"],
  ["<", "&lt;"],
  [">", "&gt;"],
  ['"', "&quot;"],
  ["'", "&#39;"],
]);

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => HTML_ESCAPES.get(char) ?? char);
}

export type PinState = "rest" | "hover" | "selected";

interface PinOptions {
  icon: LocationIcon;
  /** Shown as a tag beside the pin on hover and when selected. */
  label: string;
  state: PinState;
  /** Set while the pin drops in, with its delay in ms. */
  dropDelay?: number;
}

function pinBody(icon: LocationIcon, dropDelay: number | undefined): string {
  const delay = dropDelay === undefined ? "" : ` style="--drop-delay:${dropDelay}ms"`;

  return `<div class="place-pin__body"${delay}>${TEARDROP}<span class="place-pin__glyph">${PLACE_ICONS[icon].fillSvg}</span></div>`;
}

export function placePin({ icon, label, state, dropDelay }: PinOptions): DivIcon {
  const classes = ["place-pin", `is-${state}`];

  if (dropDelay !== undefined) classes.push("is-new");

  return divIcon({
    html: `${pinBody(icon, dropDelay)}<span class="place-pin__label">${escapeHtml(label)}</span>`,
    className: classes.join(" "),
    iconSize: [PIN_WIDTH, PIN_HEIGHT],
    iconAnchor: [PIN_WIDTH / 2, PIN_HEIGHT - 1],
    // Clears the pin at its largest (selected) size.
    popupAnchor: [0, -PIN_HEIGHT - 6],
  });
}

/** Where a new place would go: translucent, dashed, with the composer's icon. */
export function previewPin(icon: LocationIcon): DivIcon {
  return divIcon({
    html: pinBody(icon, undefined),
    className: "place-pin is-preview",
    iconSize: [PIN_WIDTH, PIN_HEIGHT],
    iconAnchor: [PIN_WIDTH / 2, PIN_HEIGHT - 1],
  });
}

/** A cluster shows its count, or the shared icon when every place in it has the same one. */
export function clusterPin(icons: readonly LocationIcon[]): DivIcon {
  const [first] = icons;
  const shared = first !== undefined && icons.every((icon) => icon === first);

  return divIcon({
    // Leaflet makes the cluster a focusable button; the hidden text names it.
    html: `<span class="place-cluster__body" aria-hidden="true">${shared ? PLACE_ICONS[first].fillSvg : icons.length}</span><span class="sr-only">${icons.length} places</span>`,
    className: "place-cluster",
    iconSize: [CLUSTER_SIZE, CLUSTER_SIZE],
  });
}
