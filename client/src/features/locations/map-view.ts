import type { Location } from "@location-manager/shared";
import { type LatLngTuple, latLngBounds, type Map as LeafletMap } from "leaflet";
import { prefersReducedMotion } from "../../lib/motion";
import type { MapView } from "./base-map";

const KUALA_LUMPUR: LatLngTuple = [3.139, 101.6869];
const DEFAULT_ZOOM = 11;
const MAX_FIT_ZOOM = 15;
const FIT_PADDING = 56;

function toLatLng(location: Location): LatLngTuple {
  return [location.latitude, location.longitude];
}

/** Every place in view, or Kuala Lumpur when there are none. */
export function placesView(locations: readonly Location[]): MapView {
  if (locations.length === 0) return { center: KUALA_LUMPUR, zoom: DEFAULT_ZOOM };

  return {
    bounds: latLngBounds(locations.map(toLatLng)),
    boundsOptions: { padding: [FIT_PADDING, FIT_PADDING], maxZoom: MAX_FIT_ZOOM },
  };
}

/** Moves the map to show `locations`, or Kuala Lumpur when there are none. */
export function fitPlaces(map: LeafletMap, locations: readonly Location[]) {
  const animate = !prefersReducedMotion();

  if (locations.length === 0) {
    map.setView(KUALA_LUMPUR, DEFAULT_ZOOM, { animate });

    return;
  }

  map.fitBounds(latLngBounds(locations.map(toLatLng)), {
    padding: [FIT_PADDING, FIT_PADDING],
    maxZoom: MAX_FIT_ZOOM,
    animate,
  });
}
