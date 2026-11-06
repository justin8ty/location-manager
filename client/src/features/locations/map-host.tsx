import { createLeafletContext, type LeafletContextInterface } from "@react-leaflet/core";
import { useQuery } from "@tanstack/react-query";
import type { Map as LeafletMap } from "leaflet";
import { createContext, type ReactNode, use, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BaseMap } from "./base-map";
import { placesView } from "./map-view";
import { locationsQuery } from "./queries";

interface MapHost {
  /** The map's DOM node. It lives outside any page and is moved into whichever page's frame is showing. */
  element: HTMLDivElement;
  /** Null until the places have loaded, since the first view fits them. */
  map: LeafletMap | null;
  /** Lets a page's layers (pins, popups) join the map; see `PlacesMap`. */
  leaflet: LeafletContextInterface | null;
}

const MapHostContext = createContext<MapHost | null>(null);

export function useMapHost(): MapHost {
  const host = use(MapHostContext);

  if (!host) throw new Error("useMapHost needs a MapHostProvider");

  return host;
}

/** The map, created once the places are known and fitted to them. */
function HostedMap({ element, onMap }: { element: HTMLDivElement; onMap: (map: LeafletMap | null) => void }) {
  const { data } = useQuery(locationsQuery);
  // Only the first view is computed: later changes to the places must not yank the map around.
  const [view] = useState(() => placesView(data ?? []));

  return createPortal(<BaseMap view={view} scaleBar className="places-map" mapRef={onMap} />, element);
}

/**
 * Keeps one map alive across the signed-in pages. Rebuilding it on every navigation threw away the view,
 * the loaded tiles and the GL context, so each page change showed a blank map being drawn again.
 */
export function MapHostProvider({ children }: { children: ReactNode }) {
  const locations = useQuery(locationsQuery);
  const ready = locations.data !== undefined || locations.isError;
  const [element] = useState(() => document.createElement("div"));
  const [map, setMap] = useState<LeafletMap | null>(null);
  const leaflet = useMemo(() => (map ? createLeafletContext(map) : null), [map]);
  const value = useMemo<MapHost>(() => ({ element, map, leaflet }), [element, map, leaflet]);

  return (
    <MapHostContext value={value}>
      {children}
      {ready && <HostedMap element={element} onMap={setMap} />}
    </MapHostContext>
  );
}

/** Where the persistent map shows on a page: place it first inside the page's map frame. */
export function MapSurface() {
  const { element, map } = useMapHost();
  const slot = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const parent = slot.current;

    if (!parent) return;

    element.className = "absolute inset-0";
    parent.append(element);
    map?.invalidateSize();

    return () => {
      if (element.parentNode === parent) element.remove();
    };
  }, [element, map]);

  return <div ref={slot} className="absolute inset-0" />;
}
