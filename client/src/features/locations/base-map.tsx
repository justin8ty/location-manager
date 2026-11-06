import { control, type Map as LeafletMap, type MaplibreGL } from "leaflet";
import { type ReactNode, type Ref, useEffect } from "react";
import { MapContainer, type MapContainerProps, ScaleControl, useMap } from "react-leaflet";
import { MAP_ATTRIBUTION, MAP_STYLE } from "./map-style";

// maplibre-gl is large (about 800 KB), so it loads after the first screen has rendered.
async function loadVectorLayer() {
  const [{ maplibreGL }, { setWorkerUrl }, { default: workerUrl }] = await Promise.all([
    import("@maplibre/maplibre-gl-leaflet"),
    import("maplibre-gl"),
    // maplibre-gl finds its worker next to its own module, which bundling moves; Vite builds it and supplies the URL.
    import("maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url"),
    import("maplibre-gl/dist/maplibre-gl.css"),
  ]);

  setWorkerUrl(workerUrl);

  return maplibreGL;
}

/** Draws the vector basemap under everything else, once maplibre-gl has loaded. Until then the frame shows land. */
function VectorBasemap() {
  const map = useMap();

  useEffect(() => {
    let layer: MaplibreGL | null = null;
    let removed = false;

    void loadVectorLayer().then((maplibreGL) => {
      if (removed) return;

      layer = maplibreGL({ style: MAP_STYLE, attributionControl: false }).addTo(map);
    });

    return () => {
      removed = true;
      layer?.remove();
    };
  }, [map]);

  return null;
}

function Attribution() {
  const map = useMap();

  useEffect(() => {
    const attribution = control.attribution({ position: "bottomright", prefix: false });
    attribution.addAttribution(MAP_ATTRIBUTION).addTo(map);

    return () => {
      attribution.remove();
    };
  }, [map]);

  return null;
}

/** The basemap's credits, for maps that can't show Leaflet's own control (e.g. one that drifts). */
export function StaticAttribution() {
  // Leaflet's (unlayered) control styles set `position`, so the wrapper does the placing.
  return (
    <div className="absolute right-0 bottom-0 z-[1001]">
      <div
        className="leaflet-control-attribution leaflet-control"
        // Static markup from map-style.ts.
        dangerouslySetInnerHTML={{ __html: MAP_ATTRIBUTION }}
      />
    </div>
  );
}

/** Keeps the map filling its frame as the frame resizes, e.g. when the mobile sheet moves. */
function FollowFrameSize() {
  const map = useMap();

  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());

    return () => observer.disconnect();
  }, [map]);

  return null;
}

export type MapView = Pick<MapContainerProps, "center" | "zoom" | "bounds" | "boundsOptions">;

interface BaseMapProps {
  view: MapView;
  /** Decorative maps can't be panned, zoomed or focused. */
  interactive?: boolean;
  scaleBar?: boolean;
  /** Off when the map draws its credits elsewhere (see StaticAttribution). */
  attribution?: boolean;
  className?: string;
  mapRef?: Ref<LeafletMap>;
  children?: ReactNode;
}

/** A Leaflet map on the app's own vector basemap (DESIGN.md: Map style). */
export function BaseMap({
  view,
  interactive = true,
  scaleBar = false,
  attribution = true,
  className = "",
  mapRef,
  children,
}: BaseMapProps) {
  return (
    <MapContainer
      {...view}
      ref={mapRef}
      className={`size-full ${className}`}
      zoomControl={false}
      attributionControl={false}
      minZoom={2}
      maxZoom={19}
      worldCopyJump
      dragging={interactive}
      touchZoom={interactive}
      doubleClickZoom={interactive}
      scrollWheelZoom={interactive}
      boxZoom={interactive}
      keyboard={interactive}
    >
      <VectorBasemap />
      <FollowFrameSize />
      {attribution && <Attribution />}
      {scaleBar && <ScaleControl position="bottomleft" imperial={false} />}
      {children}
    </MapContainer>
  );
}
