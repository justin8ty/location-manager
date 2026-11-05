const coordinateFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 6, useGrouping: false });

/** A coordinate rounded to 6 decimals (about 10 cm), without trailing zeros. */
export function formatCoordinate(value: number): string {
  return coordinateFormat.format(value);
}

export function formatLocationCount(count: number): string {
  return count === 1 ? "1 location" : `${count} locations`;
}
