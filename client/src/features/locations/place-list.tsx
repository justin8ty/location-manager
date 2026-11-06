import type { Location, LocationIcon } from "@location-manager/shared";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { type KeyboardEvent, type Ref, useEffect, useState } from "react";
import { formatCoordinates, formatRelativeTime } from "./format";
import { PLACE_ICON_KEYS, PLACE_ICONS } from "./place-icons";

const SKELETON_ROWS = 6;
const CLOCK_TICK_MS = 30_000;

/** Newest first. */
export function sortPlaces(locations: readonly Location[]): Location[] {
  return locations.toSorted((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Places whose name or category matches `query`, within `category` when one is chosen. */
export function filterPlaces(locations: readonly Location[], query: string, category: LocationIcon | null): Location[] {
  const needle = query.trim().toLowerCase();

  return locations.filter((location) => {
    if (category !== null && location.icon !== category) return false;

    if (needle === "") return true;

    return (
      location.name.toLowerCase().includes(needle) || PLACE_ICONS[location.icon].label.toLowerCase().includes(needle)
    );
  });
}

interface PlaceSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
  inputRef: Ref<HTMLInputElement>;
}

export function PlaceSearch({ query, onQueryChange, inputRef }: PlaceSearchProps) {
  return (
    <div className="flex h-[52px] shrink-0 items-center">
      <label className="relative flex flex-1 items-center">
        <MagnifyingGlassIcon size={18} aria-hidden className="pointer-events-none absolute left-3 text-ink-2" />
        <input
          ref={inputRef}
          type="search"
          aria-label="Search places"
          placeholder="Search places"
          autoComplete="off"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          className="h-(--tap) w-full rounded-md border border-rule bg-field pr-10 pl-10 text-input text-ink transition-colors duration-[120ms] placeholder:text-ink-3 hover:border-[#c9bfae] [&::-webkit-search-cancel-button]:hidden"
        />
        <kbd
          aria-hidden
          className="pointer-events-none absolute right-3 hidden h-5 min-w-5 items-center justify-center rounded border border-rule font-mono text-[11px] text-ink-2 [@media(hover:hover)]:flex"
        >
          /
        </kbd>
      </label>
    </div>
  );
}

interface CategoryChipsProps {
  locations: readonly Location[];
  category: LocationIcon | null;
  onCategoryChange: (category: LocationIcon | null) => void;
}

interface ChipProps {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}

function Chip({ label, count, active, onClick }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className="group flex h-(--tap) shrink-0 items-center active:translate-y-px"
    >
      <span
        className={`flex h-8 items-center gap-1.5 rounded-full border px-3 text-meta font-medium transition-colors duration-[120ms] ${active ? "border-ink bg-ink text-chrome" : "border-rule bg-field text-ink group-hover:bg-hover"}`}
      >
        {label}
        <span className={`coords text-[12px] ${active ? "text-chrome/70" : "text-ink-2"}`}>{count}</span>
      </span>
    </button>
  );
}

/** One chip per category in use, with its count. One can be chosen at a time (DESIGN.md: Pages, Map). */
export function CategoryChips({ locations, category, onCategoryChange }: CategoryChipsProps) {
  const counts = new Map<LocationIcon, number>();

  for (const location of locations) counts.set(location.icon, (counts.get(location.icon) ?? 0) + 1);

  return (
    <div role="group" aria-label="Filter by category" className="-mx-5 flex shrink-0 gap-1.5 overflow-x-auto px-5 [scrollbar-width:none]">
      <Chip label="All" count={locations.length} active={category === null} onClick={() => onCategoryChange(null)} />
      {PLACE_ICON_KEYS.map((key) => {
        const count = counts.get(key);

        if (count === undefined) return null;

        return (
          <Chip
            key={key}
            label={PLACE_ICONS[key].label}
            count={count}
            active={category === key}
            onClick={() => onCategoryChange(category === key ? null : key)}
          />
        );
      })}
    </div>
  );
}

/** The current time, refreshed often enough for relative times like "5m ago". */
function useNow(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), CLOCK_TICK_MS);

    return () => window.clearInterval(timer);
  }, []);

  return now;
}

interface PlaceRowProps {
  location: Location;
  selected: boolean;
  arrived: boolean;
  now: Date;
  onSelect: (location: Location) => void;
  onHover: (id: string | null) => void;
}

function PlaceRow({ location, selected, arrived, now, onSelect, onHover }: PlaceRowProps) {
  const IconComponent = PLACE_ICONS[location.icon].component;

  return (
    <li>
      <button
        type="button"
        data-place-row
        aria-current={selected || undefined}
        onClick={() => onSelect(location)}
        onPointerEnter={() => onHover(location.id)}
        onPointerLeave={() => onHover(null)}
        onFocus={() => onHover(location.id)}
        onBlur={() => onHover(null)}
        className={`grid h-(--row) w-full grid-cols-[40px_1fr_auto] items-center gap-3 rounded-[10px] px-2.5 text-left transition-colors duration-[120ms] ${selected ? "bg-accent-wash" : "hover:bg-hover"} ${arrived ? "motion-safe:animate-[row-flash_900ms_ease-out]" : ""}`}
      >
        <span
          className={`flex size-10 items-center justify-center rounded-[9px] ${selected ? "bg-accent text-white" : "bg-rule-2 text-ink"}`}
        >
          <IconComponent size={20} weight={selected ? "fill" : "regular"} aria-hidden />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-medium text-ink">{location.name}</span>
          <span className="coords truncate text-small text-ink-2">
            {formatCoordinates(location.latitude, location.longitude, 4)}
          </span>
        </span>
        <span className="self-start pt-[11px] text-meta whitespace-nowrap text-ink-2">
          {formatRelativeTime(location.createdAt, now)}
        </span>
      </button>
    </li>
  );
}

function PlaceSkeleton() {
  return (
    <ul aria-hidden className="flex flex-col">
      {Array.from({ length: SKELETON_ROWS }, (_, index) => (
        <li
          key={index}
          className="grid h-(--row) grid-cols-[40px_1fr] items-center gap-3 px-2.5 motion-safe:animate-[soft-pulse_1.6s_ease-in-out_infinite]"
        >
          <span className="size-10 rounded-[9px] bg-rule-2" />
          <span className="flex flex-col gap-2">
            <span className="h-3 w-3/5 rounded bg-rule-2" />
            <span className="h-2.5 w-2/5 rounded bg-rule-2" />
          </span>
        </li>
      ))}
    </ul>
  );
}

// ↑/↓ move between rows; Enter (the rows are buttons) selects.
function handleListKeyDown(event: KeyboardEvent<HTMLUListElement>) {
  if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

  const rows = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("[data-place-row]"));
  const current = rows.findIndex((row) => row === document.activeElement);
  const next = rows[event.key === "ArrowDown" ? current + 1 : Math.max(current - 1, 0)];

  if (!next) return;

  event.preventDefault();
  next.focus();
  next.scrollIntoView({ block: "nearest" });
}

interface PlaceListProps {
  /** Undefined while loading. */
  locations: readonly Location[] | undefined;
  /** Whether the user has any places at all, as opposed to none matching the filters. */
  hasPlaces: boolean;
  query: string;
  arrivals: ReadonlyMap<string, number>;
  selectedId: string | null;
  onSelect: (location: Location) => void;
  onHover: (id: string | null) => void;
}

export function PlaceList(props: PlaceListProps) {
  const now = useNow();

  if (props.locations === undefined) return <PlaceSkeleton />;

  if (!props.hasPlaces) return <p className="px-2.5 py-4 text-ink-2">No places yet</p>;

  if (props.locations.length === 0) {
    return <p className="px-2.5 py-4 break-words text-ink-2">No places match "{props.query.trim()}".</p>;
  }

  return (
    <ul aria-label="Places" onKeyDown={handleListKeyDown} className="flex flex-col">
      {props.locations.map((location) => (
        <PlaceRow
          key={location.id}
          location={location}
          selected={location.id === props.selectedId}
          arrived={props.arrivals.has(location.id)}
          now={now}
          onSelect={props.onSelect}
          onHover={props.onHover}
        />
      ))}
    </ul>
  );
}
