import type { Location } from "@location-manager/shared";
import { CornersOutIcon, MinusIcon, PlusIcon } from "@phosphor-icons/react";
import type { LeafletMouseEvent, Map as LeafletMap } from "leaflet";
import { useEffect, useState } from "react";
import { Button } from "../../components/button";
import { formatCoordinates } from "./format";
import { fitPlaces } from "./places-map";

// The area name is static for now (DESIGN.md: Pages, Map).
const AREA_NAME = "Kuala Lumpur";

function useZoom(map: LeafletMap | null): number | null {
  const [zoom, setZoom] = useState<number | null>(null);

  useEffect(() => {
    if (!map) return;

    const update = () => setZoom(map.getZoom());
    update();
    map.on("zoomend", update);

    return () => {
      map.off("zoomend", update);
    };
  }, [map]);

  return zoom;
}

/** Where the cursor points on the map, or null when it's elsewhere. */
function useCursorPosition(map: LeafletMap | null): string | null {
  const [position, setPosition] = useState<string | null>(null);

  useEffect(() => {
    if (!map) return;

    const move = (event: LeafletMouseEvent) => {
      const { lat, lng } = event.latlng.wrap();
      setPosition(formatCoordinates(lat, lng, 6));
    };

    const leave = () => setPosition(null);
    map.on("mousemove", move);
    map.on("mouseout", leave);

    return () => {
      map.off("mousemove", move);
      map.off("mouseout", leave);
    };
  }, [map]);

  return position;
}

interface ZoomButtonsProps {
  map: LeafletMap | null;
  zoom: number | null;
  floating?: boolean;
}

function ZoomButtons({ map, zoom, floating = false }: ZoomButtonsProps) {
  const atMin = map === null || zoom === null || zoom <= map.getMinZoom();
  const atMax = map === null || zoom === null || zoom >= map.getMaxZoom();

  const button =
    "flex size-(--tap) items-center justify-center text-ink transition-colors duration-[120ms] enabled:hover:bg-hover enabled:active:translate-y-px disabled:text-ink-3";

  return (
    <div
      role="group"
      aria-label="Zoom"
      className={`flex divide-x divide-rule overflow-hidden rounded-md border border-rule bg-field ${floating ? "shadow-float" : ""}`}
    >
      <button type="button" aria-label="Zoom out" disabled={atMin} onClick={() => map?.zoomOut()} className={button}>
        <MinusIcon size={18} aria-hidden />
      </button>
      <button type="button" aria-label="Zoom in" disabled={atMax} onClick={() => map?.zoomIn()} className={button}>
        <PlusIcon size={18} aria-hidden />
      </button>
    </div>
  );
}

interface MapControlsProps {
  map: LeafletMap | null;
  locations: readonly Location[];
}

/** The bar above the map frame: area, zoom level, cursor readout, Fit all and zoom. */
export function MapToolbar({ map, locations }: MapControlsProps) {
  const zoom = useZoom(map);
  const cursor = useCursorPosition(map);

  return (
    <div className="flex min-w-0 flex-1 items-center gap-4 pl-3">
      <p className="text-title whitespace-nowrap text-ink">{AREA_NAME}</p>
      <span className="coords w-8 shrink-0 text-small text-ink-2">{zoom === null ? "" : `z${zoom}`}</span>
      <span aria-hidden className="coords hidden min-w-0 flex-1 truncate text-small text-ink-2 desktop:block">
        {cursor}
      </span>
      <div className="ml-auto flex items-center gap-2">
        <Button icon={CornersOutIcon} disabled={!map} onClick={() => map && fitPlaces(map, locations)}>
          Fit all
        </Button>
        <ZoomButtons map={map} zoom={zoom} />
      </div>
    </div>
  );
}

/** On phones the toolbar becomes buttons floating over the top of the map. */
export function FloatingMapControls({ map, locations }: MapControlsProps) {
  const zoom = useZoom(map);

  return (
    <div className="pointer-events-none absolute inset-x-3 top-3 z-[1001] flex items-start justify-between">
      <Button
        icon={CornersOutIcon}
        disabled={!map}
        onClick={() => map && fitPlaces(map, locations)}
        className="pointer-events-auto shadow-float"
      >
        Fit all
      </Button>
      <div className="pointer-events-auto">
        <ZoomButtons map={map} zoom={zoom} floating />
      </div>
    </div>
  );
}
