import { createContext, type ReactNode, use, useMemo, useState } from "react";

/** On phones the Map tab browses the places and the Add place tab adds or edits one. */
export type PlacesMode = "browse" | "add";

interface PlacesModeValue {
  mode: PlacesMode;
  setMode: (mode: PlacesMode) => void;
}

const PlacesModeContext = createContext<PlacesModeValue | null>(null);

/** Holds the phone's tab choice above the pages, so the tab bar and the map page agree on it. */
export function PlacesModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<PlacesMode>("browse");
  const value = useMemo(() => ({ mode, setMode }), [mode]);

  return <PlacesModeContext value={value}>{children}</PlacesModeContext>;
}

export function usePlacesMode(): PlacesModeValue {
  const value = use(PlacesModeContext);

  if (!value) throw new Error("usePlacesMode needs a PlacesModeProvider");

  return value;
}
