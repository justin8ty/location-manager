import { useSyncExternalStore } from "react";

/** The phone layout (DESIGN.md: Layout, Mobile). */
export const MOBILE_QUERY = "(max-width: 760px)";

/** Whether `query` matches, kept current as the viewport changes. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);

      return () => list.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
  );
}

export function useIsMobile(): boolean {
  return useMediaQuery(MOBILE_QUERY);
}
