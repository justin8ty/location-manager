import L, { control, type LatLng, type Map as LeafletMap, type MaplibreGL } from "leaflet";
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

// The GL canvas is drawn at most this sharp: a phone's 3x screen costs 2.25x the pixels of 2x for little to see.
const MAX_PIXEL_RATIO = 2;

// Labels fade in over this long; the default 300 ms reads as flicker while zooming.
const LABEL_FADE_MS = 100;

// If maplibre hasn't drawn by then, show the canvas as it is rather than leave it scaled.
const SETTLE_TIMEOUT_MS = 120;

interface JumpTarget {
  center: LatLng;
  zoom: number;
}

interface GlMapInternals {
  jumpTo(target: JumpTarget): void;
  once(type: "render", listener: () => void): void;
  triggerRepaint(): void;
  _actualCanvas: HTMLCanvasElement;
}

/** The parts of maplibre-gl-leaflet's layer that `settleAfterZoom` uses; the library doesn't type them. */
interface LayerInternals {
  _map: LeafletMap | null;
  _glMap: GlMapInternals | null;
  _resizeContainer(): void;
  _zoomEnd(): void;
}

/**
 * Replaces the layer's own end-of-zoom step. During a zoom animation Leaflet scales the GL canvas like a
 * bitmap; the library then puts the canvas back at scale 1 before maplibre has drawn the new zoom, so one
 * frame shows stale tiles at the wrong size. Here the scaled canvas stays until maplibre has drawn.
 */
function settleAfterZoom(this: LayerInternals) {
  L.Util.requestAnimFrame(() => {
    const { _map: map, _glMap: gl } = this;

    if (!map || !gl) return;

    const center = map.getCenter();
    const offset = map.latLngToContainerPoint(map.getBounds().getNorthWest());
    let settled = false;

    const settle = () => {
      if (settled || !this._glMap) return;

      settled = true;
      L.DomUtil.setTransform(gl._actualCanvas, offset, 1);
      this._zoomEnd();
    };

    this._resizeContainer();
    gl.once("render", settle);
    window.setTimeout(settle, SETTLE_TIMEOUT_MS);
    gl.jumpTo({ center, zoom: map.getZoom() - 1 });
    gl.triggerRepaint();
  });
}

/** Draws the vector basemap under everything else, once maplibre-gl has loaded. Until then the frame shows land. */
function VectorBasemap() {
  const map = useMap();

  useEffect(() => {
    let layer: MaplibreGL | null = null;
    let removed = false;

    void loadVectorLayer().then((maplibreGL) => {
      if (removed) return;

      layer = maplibreGL({
        style: MAP_STYLE,
        attributionControl: false,
        pixelRatio: Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO),
        fadeDuration: LABEL_FADE_MS,
      });
      // Set before adding: the layer reads it when it joins the map.
      Object.assign(layer, { _transitionEnd: settleAfterZoom });
      layer.addTo(map);
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
    // Zero-sized while the persistent map is between pages; resizing then would lose its place.
    const observer = new ResizeObserver(() => {
      if (map.getContainer().clientWidth > 0) map.invalidateSize();
    });

    observer.observe(map.getContainer());

    return () => observer.disconnect();
  }, [map]);

  return null;
}

// Street level; the vector tiles stop at 14, so going deeper only draws the same data larger.
const MAX_ZOOM = 18;

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
      maxZoom={MAX_ZOOM}
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
