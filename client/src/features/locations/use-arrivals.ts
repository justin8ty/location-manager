import type { Location } from "@location-manager/shared";
import { useEffect, useState } from "react";

const DROP_MS = 170;
const STAGGER_MS = 30;
const MAX_TOTAL_MS = 1000;

// Long enough for the last pin to land and the row flash (900ms) to finish.
const SETTLE_MS = MAX_TOTAL_MS + 900;

const NONE: ReadonlyMap<string, number> = new Map();

/** Staggers drops 30ms apart, closer together when needed so the whole set lands within 1s. */
function staggerDelays(arrived: readonly Location[]): Map<string, number> {
  const step = Math.min(STAGGER_MS, (MAX_TOTAL_MS - DROP_MS) / Math.max(arrived.length - 1, 1));

  return new Map(arrived.map((location, index) => [location.id, Math.round(index * step)]));
}

/**
 * Places that appeared since the last render (added, or imported), each with its drop-in delay in ms.
 * The places present when the list first loads aren't arrivals. Arrivals clear once their animations end.
 */
export function useArrivals(locations: readonly Location[] | undefined): ReadonlyMap<string, number> {
  const [seen, setSeen] = useState(locations);
  const [arrivals, setArrivals] = useState(NONE);

  if (locations !== seen) {
    setSeen(locations);

    if (seen !== undefined && locations !== undefined) {
      const known = new Set(seen.map((location) => location.id));
      const arrived = locations.filter((location) => !known.has(location.id));

      if (arrived.length > 0) setArrivals(staggerDelays(arrived));
    }
  }

  useEffect(() => {
    if (arrivals.size === 0) return;

    const timer = window.setTimeout(() => setArrivals(NONE), SETTLE_MS);

    return () => window.clearTimeout(timer);
  }, [arrivals]);

  return arrivals;
}
