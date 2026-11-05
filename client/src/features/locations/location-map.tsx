import { Button } from "@cloudflare/kumo";
import type { Location } from "@location-manager/shared";
import { TrashIcon } from "@phosphor-icons/react";
import {
  type DivIconOptions,
  divIcon,
  type LatLng,
  type LatLngTuple,
  type LeafletEventHandlerFnMap,
  latLngBounds,
  type Marker as LeafletMarker,
} from "leaflet";
import { type RefObject, useEffect, useEffectEvent, useRef, useState } from "react";
import { MapContainer, type MapContainerProps, Marker, Popup, TileLayer, useMap, ZoomControl } from "react-leaflet";
import { formatCoordinate } from "./format";

const KUALA_LUMPUR: LatLngTuple = [3.139, 101.6869];
const DEFAULT_ZOOM = 11;
const MAX_FIT_ZOOM = 15;
const FOCUS_ZOOM = 15;
const FIT_PADDING = 48;

// A pin whose tip sits on the coordinate; the white outline keeps it legible on any tile.
const PIN_SVG = `<svg viewBox="-1.5 -1.5 27 35" width="27" height="35" aria-hidden="true">
  <path d="M12 0C5.37 0 0 5.37 0 12c0 8.4 12 20 12 20s12-11.6 12-20C24 5.37 18.63 0 12 0Z" class="fill-kumo-brand" stroke="white" stroke-width="1.5"/>
  <circle cx="12" cy="12" r="4.25" fill="white"/>
</svg>`;

const PIN_GEOMETRY = {
  html: PIN_SVG,
  iconSize: [27, 35],
  iconAnchor: [13.5, 33.5],
  popupAnchor: [0, -30],
} satisfies DivIconOptions;

const locationPin = divIcon({
  ...PIN_GEOMETRY,
  className:
    "drop-shadow-[0_1px_2px_rgb(0_0_0/0.35)] [&>svg]:origin-bottom [&>svg]:transition-transform [&>svg]:duration-150 [@media(hover:hover)]:hover:[&>svg]:scale-110",
});

const previewPin = divIcon({ ...PIN_GEOMETRY, className: "opacity-50" });

function toLatLng(location: Location): LatLngTuple {
  return [location.latitude, location.longitude];
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Kuala Lumpur when there is nothing to show, otherwise every marker in view. */
function initialView(locations: Location[], leftInset: number): MapContainerProps {
  if (locations.length === 0) return { center: KUALA_LUMPUR, zoom: DEFAULT_ZOOM };

  return {
    bounds: latLngBounds(locations.map(toLatLng)),
    boundsOptions: {
      paddingTopLeft: [leftInset + FIT_PADDING, FIT_PADDING],
      paddingBottomRight: [FIT_PADDING, FIT_PADDING],
      maxZoom: MAX_FIT_ZOOM,
    },
  };
}

/** Reports clicks on empty map. A click that only closes an open popup isn't a pick. */
function PickOnClick({ onPick }: { onPick: (latitude: number, longitude: number) => void }) {
  const map = useMap();

  const pick = useEffectEvent((latlng: LatLng) => {
    // Panning across the antimeridian yields longitudes beyond ±180.
    const { lat, lng } = latlng.wrap();
    onPick(lat, lng);
  });

  useEffect(() => {
    let popupOpen = false;
    let clickClosesPopup = false;

    // Registered once, on mount, so `preclick` here always runs before the preclick handler
    // a popup registers when it opens (and uses to close itself).
    const handlers: LeafletEventHandlerFnMap = {
      popupopen: () => {
        popupOpen = true;
      },
      popupclose: () => {
        popupOpen = false;
      },
      preclick: () => {
        clickClosesPopup = popupOpen;
      },
      click: (event) => {
        if (!clickClosesPopup) pick(event.latlng);
      },
    };

    map.on(handlers);

    return () => {
      map.off(handlers);
    };
  }, [map]);

  return null;
}

interface FlyToLocationProps {
  locationId: string | null;
  markers: RefObject<Map<string, LeafletMarker>>;
}

/** Flies to the location's marker, then opens its popup (opening it mid-flight would cancel the flight). */
function FlyToLocation({ locationId, markers }: FlyToLocationProps) {
  const map = useMap();

  useEffect(() => {
    const marker = locationId === null ? undefined : markers.current.get(locationId);

    if (!marker) return;

    const openPopup = () => marker.openPopup();
    const zoom = Math.max(map.getZoom(), FOCUS_ZOOM);
    map.once("moveend", openPopup);

    if (prefersReducedMotion()) map.setView(marker.getLatLng(), zoom);
    else map.flyTo(marker.getLatLng(), zoom, { duration: 0.8 });

    return () => {
      map.off("moveend", openPopup);
    };
  }, [map, locationId, markers]);

  return null;
}

interface LocationPopupProps {
  location: Location;
  onDelete: (location: Location) => void;
}

function LocationPopup({ location, onDelete }: LocationPopupProps) {
  return (
    <div className="flex min-w-44 flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-base font-semibold break-words text-kumo-default">{location.name}</span>
        <span className="font-mono text-xs text-kumo-subtle tabular-nums">
          {formatCoordinate(location.latitude)}, {formatCoordinate(location.longitude)}
        </span>
      </div>
      <Button
        size="sm"
        variant="secondary-destructive"
        icon={TrashIcon}
        className="self-start"
        onClick={() => onDelete(location)}
      >
        Delete
      </Button>
    </div>
  );
}

interface LocationMapProps {
  locations: Location[];
  /** Where the location being added would go, shown as a faded pin. */
  preview: LatLngTuple | null;
  /** The location to fly to and open, e.g. one just added. */
  focusedId: string | null;
  /** Width in px of the map's left edge covered by other UI, kept clear when fitting markers. */
  leftInset: number;
  onPick: (latitude: number, longitude: number) => void;
  onDelete: (location: Location) => void;
}

export function LocationMap(props: LocationMapProps) {
  // Only the first view is computed: later changes to locations must not yank the map around.
  const [view] = useState(() => initialView(props.locations, props.leftInset));
  const markers = useRef(new Map<string, LeafletMarker>());

  return (
    <MapContainer {...view} className="location-map size-full" zoomControl={false} minZoom={2} worldCopyJump>
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <ZoomControl position="bottomright" />
      <PickOnClick onPick={props.onPick} />
      <FlyToLocation locationId={props.focusedId} markers={markers} />

      {props.locations.map((location) => (
        <Marker
          key={location.id}
          position={toLatLng(location)}
          icon={locationPin}
          title={location.name}
          ref={(marker) => {
            if (!marker) return;

            markers.current.set(location.id, marker);

            return () => {
              markers.current.delete(location.id);
            };
          }}
        >
          <Popup>
            <LocationPopup location={location} onDelete={props.onDelete} />
          </Popup>
        </Marker>
      ))}

      {props.preview && <Marker position={props.preview} icon={previewPin} interactive={false} keyboard={false} />}
    </MapContainer>
  );
}
