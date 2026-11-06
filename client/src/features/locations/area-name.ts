import type { LatLngBounds, Map as LeafletMap } from "leaflet";
import type { Map as MaplibreMap } from "maplibre-gl";
import { z } from "zod";
import { basemapOf } from "./base-map";
import { BASEMAP_SOURCE } from "./map-style";

interface Level {
  /** The level is the right size to name the view from this zoom up. */
  minZoom: number;
  classes: readonly string[];
  /** The place must be in view; coarser levels (a country) can name a view that doesn't show their label. */
  inView: boolean;
}

// Finest first. A view is named by the finest level its zoom suits that has a place to offer.
const LEVELS: readonly Level[] = [
  { minZoom: 14, classes: ["suburb", "quarter", "neighbourhood"], inView: true },
  { minZoom: 9, classes: ["city", "town", "village"], inView: true },
  { minZoom: 5, classes: ["state", "province"], inView: false },
  { minZoom: 0, classes: ["country"], inView: false },
];

interface Place {
  name: string;
  placeClass: string;
  latitude: number;
  longitude: number;
}

/** The properties of a `place` feature in OpenMapTiles that name it. */
const placePropertiesSchema = z.object({
  class: z.string(),
  name: z.string().optional(),
  "name:latin": z.string().optional(),
});

/** The places in the basemap's loaded tiles. */
function loadedPlaces(basemap: MaplibreMap): Place[] {
  const places: Place[] = [];

  for (const feature of basemap.querySourceFeatures(BASEMAP_SOURCE, { sourceLayer: "place" })) {
    const properties = placePropertiesSchema.safeParse(feature.properties);

    if (!properties.success || feature.geometry.type !== "Point") continue;

    const name = properties.data["name:latin"] ?? properties.data.name;
    const [longitude, latitude] = feature.geometry.coordinates;

    if (!name || longitude === undefined || latitude === undefined) continue;

    places.push({ name, placeClass: properties.data.class, latitude, longitude });
  }

  return places;
}

function nearest(places: readonly Place[], level: Level, center: { lat: number; lng: number }, bounds: LatLngBounds): string | null {
  const longitudeScale = Math.cos((center.lat * Math.PI) / 180);
  let best: { name: string; distance: number } | null = null;

  for (const { name, placeClass, latitude, longitude } of places) {
    if (!level.classes.includes(placeClass)) continue;

    if (level.inView && !bounds.contains([latitude, longitude])) continue;

    const distance = (latitude - center.lat) ** 2 + ((longitude - center.lng) * longitudeScale) ** 2;

    if (best === null || distance < best.distance) best = { name, distance };
  }

  return best?.name ?? null;
}

/**
 * What to call the area the map shows, read from the place labels already in the basemap's tiles: a
 * neighbourhood when zoomed right in, then a city, a state, a country. Null while no tile has one.
 */
export function areaNameAt(map: LeafletMap): string | null {
  const basemap = basemapOf(map);

  if (!basemap) return null;

  const places = loadedPlaces(basemap);
  const center = map.getCenter().wrap();
  const bounds = map.getBounds();

  for (const level of LEVELS) {
    if (level.minZoom > map.getZoom()) continue;

    const name = nearest(places, level, center, bounds);

    if (name !== null) return name;
  }

  return null;
}
