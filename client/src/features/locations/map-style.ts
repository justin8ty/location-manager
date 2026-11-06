import type { DataDrivenPropertyValueSpecification, FilterSpecification, StyleSpecification } from "maplibre-gl";

/** The basemap (DESIGN.md: Map style): OpenFreeMap vector tiles drawn in the app's own colours. */

/** One word on the map; the sources it stands for open above it on click. */
export const MAP_ATTRIBUTION =
  '<details class="map-credits"><summary>Credits</summary><div class="map-credits-list">' +
  '<a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a> ' +
  '<a href="https://www.openmaptiles.org/" target="_blank" rel="noreferrer">© OpenMapTiles</a> ' +
  '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a>' +
  "</div></details>";

export const BASEMAP_SOURCE = "openmaptiles";
const SOURCE = BASEMAP_SOURCE;
const LABEL_TEXT: DataDrivenPropertyValueSpecification<string> = ["coalesce", ["get", "name:latin"], ["get", "name"]];
const REGULAR_FONT = ["Noto Sans Regular"];
const BOLD_FONT = ["Noto Sans Bold"];

/** A road width that grows exponentially (base 1.5) from z8 to z17. */
function roadWidth(atZ8: number, atZ17: number): DataDrivenPropertyValueSpecification<number> {
  return ["interpolate", ["exponential", 1.5], ["zoom"], 8, atZ8, 17, atZ17];
}

function classIn(...classes: string[]): FilterSpecification {
  return ["in", ["get", "class"], ["literal", classes]];
}

// Service roads (alleys, car parks) only appear once the street is the subject.
const MINOR_ROADS = classIn("minor", "tertiary");
const SERVICE_ROADS = classIn("service");
const MAJOR_ROADS = classIn("primary", "secondary", "trunk");
const MOTORWAYS = classIn("motorway");
const ROUND = { "line-cap": "round", "line-join": "round" } as const;

export const MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    [SOURCE]: { type: "vector", url: "https://tiles.openfreemap.org/planet" },
  },
  glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
  layers: [
    { id: "background", type: "background", paint: { "background-color": "#ece6d9" } },
    {
      id: "landcover",
      type: "fill",
      source: SOURCE,
      "source-layer": "landcover",
      filter: classIn("wood", "grass", "forest"),
      paint: { "fill-color": "#dfe1c8", "fill-opacity": 0.7 },
    },
    { id: "park", type: "fill", source: SOURCE, "source-layer": "park", paint: { "fill-color": "#dfe1c8" } },
    { id: "water", type: "fill", source: SOURCE, "source-layer": "water", paint: { "fill-color": "#c3d1d1" } },
    {
      id: "waterway",
      type: "line",
      source: SOURCE,
      "source-layer": "waterway",
      paint: { "line-color": "#c3d1d1", "line-width": 1.2 },
    },
    {
      id: "building",
      type: "fill",
      source: SOURCE,
      "source-layer": "building",
      minzoom: 16,
      paint: { "fill-color": "#e2dacb" },
    },
    {
      id: "rail",
      type: "line",
      source: SOURCE,
      "source-layer": "transportation",
      filter: classIn("rail", "transit"),
      paint: { "line-color": "#c4baa9", "line-width": 1, "line-dasharray": [3, 2] },
    },
    {
      id: "road-minor",
      type: "line",
      source: SOURCE,
      "source-layer": "transportation",
      minzoom: 13,
      filter: MINOR_ROADS,
      layout: ROUND,
      paint: { "line-color": "#fbf8f1", "line-width": roadWidth(0.3, 7) },
    },
    {
      id: "road-service",
      type: "line",
      source: SOURCE,
      "source-layer": "transportation",
      minzoom: 16,
      filter: SERVICE_ROADS,
      layout: ROUND,
      paint: { "line-color": "#fbf8f1", "line-width": roadWidth(0.3, 4) },
    },
    {
      id: "road-major-casing",
      type: "line",
      source: SOURCE,
      "source-layer": "transportation",
      filter: MAJOR_ROADS,
      paint: { "line-color": "#cfc4af", "line-width": roadWidth(1, 13) },
    },
    {
      id: "road-major",
      type: "line",
      source: SOURCE,
      "source-layer": "transportation",
      filter: MAJOR_ROADS,
      layout: ROUND,
      paint: { "line-color": "#ffffff", "line-width": roadWidth(0.6, 11) },
    },
    {
      id: "motorway-casing",
      type: "line",
      source: SOURCE,
      "source-layer": "transportation",
      filter: MOTORWAYS,
      paint: { "line-color": "#c7b393", "line-width": roadWidth(1.4, 15) },
    },
    {
      id: "motorway",
      type: "line",
      source: SOURCE,
      "source-layer": "transportation",
      filter: MOTORWAYS,
      layout: ROUND,
      paint: { "line-color": "#f0dfc6", "line-width": roadWidth(0.9, 13) },
    },
    {
      id: "boundary",
      type: "line",
      source: SOURCE,
      "source-layer": "boundary",
      filter: ["<=", ["get", "admin_level"], 4],
      paint: { "line-color": "#b3a894", "line-width": 1, "line-dasharray": [4, 2] },
    },
    {
      id: "road-label",
      type: "symbol",
      source: SOURCE,
      "source-layer": "transportation_name",
      minzoom: 15,
      layout: {
        "symbol-placement": "line",
        "text-field": LABEL_TEXT,
        "text-font": REGULAR_FONT,
        "text-size": 11,
      },
      paint: { "text-color": "#8a8174", "text-halo-color": "#fbf8f1", "text-halo-width": 1.5 },
    },
    {
      id: "place-neighbourhood",
      type: "symbol",
      source: SOURCE,
      "source-layer": "place",
      minzoom: 13,
      maxzoom: 16,
      filter: classIn("neighbourhood", "quarter", "suburb"),
      layout: {
        "text-field": LABEL_TEXT,
        "text-font": REGULAR_FONT,
        "text-size": 11,
        "text-transform": "uppercase",
        "text-letter-spacing": 0.12,
        "text-max-width": 8,
      },
      paint: { "text-color": "#8a8174", "text-halo-color": "#ece6d9", "text-halo-width": 1.5 },
    },
    {
      id: "place-town",
      type: "symbol",
      source: SOURCE,
      "source-layer": "place",
      filter: classIn("town", "village"),
      layout: { "text-field": LABEL_TEXT, "text-font": REGULAR_FONT, "text-size": 12.5 },
      paint: { "text-color": "#5b544b", "text-halo-color": "#ece6d9", "text-halo-width": 1.5 },
    },
    {
      id: "place-city",
      type: "symbol",
      source: SOURCE,
      "source-layer": "place",
      filter: classIn("city"),
      layout: { "text-field": LABEL_TEXT, "text-font": BOLD_FONT, "text-size": 15 },
      paint: { "text-color": "#2c2722", "text-halo-color": "#ece6d9", "text-halo-width": 2 },
    },
  ],
};
