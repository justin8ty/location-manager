const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const LAST_RELATIVE_DAY = 6;

const coordinateFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 6, useGrouping: false });

/** A coordinate rounded to 6 decimals (about 10 cm), without trailing zeros. */
export function formatCoordinate(value: number): string {
  return coordinateFormat.format(value);
}

export function formatLocationCount(count: number): string {
  return count === 1 ? "1 location" : `${count} locations`;
}

/** A coordinate as an input holds it: a plain decimal with 6 places (about 10 cm). */
export function formatCoordinateInput(value: number): string {
  return value.toFixed(6);
}

function hemisphere(value: number, positive: string, negative: string): string {
  return value < 0 ? negative : positive;
}

/** `3.1573° N  101.7122° E`, with `decimals` places. */
export function formatCoordinates(latitude: number, longitude: number, decimals: number): string {
  const lat = `${Math.abs(latitude).toFixed(decimals)}° ${hemisphere(latitude, "N", "S")}`;
  const lng = `${Math.abs(longitude).toFixed(decimals)}° ${hemisphere(longitude, "E", "W")}`;

  return `${lat}  ${lng}`;
}

export function formatPlaceCount(count: number): string {
  return count === 1 ? "1 place" : `${count} places`;
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** `Just now`, `5m ago`, `3h ago`, `Yesterday`, `2 days ago`, then `12 Mar` (with the year when it isn't this year). */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const elapsed = now.getTime() - date.getTime();

  if (elapsed < MINUTE_MS) return "Just now";

  if (elapsed < HOUR_MS) return `${Math.floor(elapsed / MINUTE_MS)}m ago`;

  if (elapsed < DAY_MS) return `${Math.floor(elapsed / HOUR_MS)}h ago`;

  const days = Math.round((startOfDay(now) - startOfDay(date)) / DAY_MS);

  if (days <= 1) return "Yesterday";

  if (days <= LAST_RELATIVE_DAY) return `${days} days ago`;

  const sameYear = date.getFullYear() === now.getFullYear();

  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: sameYear ? undefined : "numeric" });
}

/** The relative time inside a sentence: `added yesterday`, `added 12 Mar`. */
export function formatAddedTime(iso: string): string {
  const relative = formatRelativeTime(iso);

  return `added ${relative.charAt(0).toLowerCase()}${relative.slice(1)}`;
}
