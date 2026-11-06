import type { Location, LocationIcon } from "@location-manager/shared";
import {
  type LatLng,
  type LatLngTuple,
  type LeafletEventHandlerFnMap,
  latLngBounds,
  type Map as LeafletMap,
  type Marker as LeafletMarker,
  type MarkerClusterGroup as LeafletClusterGroup,
} from "leaflet";
import { type ReactNode, type Ref, type RefObject, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { Marker, Popup, useMap } from "react-leaflet";
import { prefersReducedMotion } from "../../lib/motion";
import { BaseMap, type MapView } from "./base-map";
import { MarkerClusterGroup, markerPlaceIcons } from "./marker-cluster-group";
import { type PinState, placePin, previewPin } from "./pins";
import { type PlaceActions, PlacePopup } from "./place-popup";

const KUALA_LUMPUR: LatLngTuple = [3.139, 101.6869];
const DEFAULT_ZOOM = 11;
const MAX_FIT_ZOOM = 15;
const FOCUS_ZOOM = 15;
const FIT_PADDING = 56;
const FLY_SECONDS = 0.6;
const SELECTED_Z_OFFSET = 1000;
const POPUP_WIDTH = 278;

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

/**
 * A request to move the map: fly to one place and open it, or fit a set of places.
 * Each request is a new object, so the same place can be shown again.
 */
export type MapFocus = { kind: "place"; id: string } | { kind: "fit"; locations: readonly Location[] };

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

interface FocusControllerProps {
  focus: MapFocus | null;
  markers: RefObject<Map<string, LeafletMarker>>;
  clusters: RefObject<LeafletClusterGroup | null>;
}

/** Carries out focus requests. A place's popup opens once the flight ends (opening it mid-flight would cancel it). */
function FocusController({ focus, markers, clusters }: FocusControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (focus === null) return;

    if (focus.kind === "fit") {
      fitPlaces(map, focus.locations);

      return;
    }

    const marker = markers.current.get(focus.id);

    if (!marker) return;

    // A place inside a cluster needs the cluster opened before its popup can show.
    const reveal = () => clusters.current?.zoomToShowLayer(marker, () => marker.openPopup());
    const zoom = Math.max(map.getZoom(), FOCUS_ZOOM);
    map.closePopup();
    map.once("moveend", reveal);

    if (prefersReducedMotion()) map.setView(marker.getLatLng(), zoom, { animate: false });
    else map.flyTo(marker.getLatLng(), zoom, { duration: FLY_SECONDS });

    return () => {
      map.off("moveend", reveal);
    };
  }, [map, focus, markers, clusters]);

  return null;
}

interface PlaceMarkerProps {
  location: Location;
  state: PinState;
  dropDelay: number | undefined;
  actions: PlaceActions | undefined;
  markers: RefObject<Map<string, LeafletMarker>>;
  onOpen: (id: string) => void;
  onClose: (id: string) => void;
}

function PlaceMarker({ location, state, dropDelay, actions, markers, onOpen, onClose }: PlaceMarkerProps) {
  const { id, icon, name, latitude, longitude } = location;
  // A new position array would make react-leaflet call setLatLng, which a cluster group handles by
  // removing and re-adding the marker (closing and reopening its popup mid-click).
  const position = useMemo<LatLngTuple>(() => [latitude, longitude], [latitude, longitude]);
  const pin = useMemo(() => placePin({ icon, label: name, state, dropDelay }), [icon, name, state, dropDelay]);

  const handlers = useMemo<LeafletEventHandlerFnMap>(
    () => ({
      popupopen: () => onOpen(id),
      popupclose: () => onClose(id),
      // Clustering removes and re-adds markers, which re-creates their element.
      add: (event) => {
        const element: LeafletMarker = event.target;
        element.getElement()?.setAttribute("aria-label", name);
      },
    }),
    [id, name, onOpen, onClose],
  );

  return (
    <Marker
      position={position}
      icon={pin}
      zIndexOffset={state === "selected" ? SELECTED_Z_OFFSET : 0}
      eventHandlers={handlers}
      ref={(marker) => {
        if (!marker) return;

        markers.current.set(id, marker);
        markerPlaceIcons.set(marker, icon);
        marker.getElement()?.setAttribute("aria-label", name);

        return () => {
          markers.current.delete(id);
        };
      }}
    >
      <Popup
        className="place-popup"
        closeButton={false}
        // The page's Esc handling closes it; Leaflet's would also swallow the key while the map has focus.
        closeOnEscapeKey={false}
        minWidth={POPUP_WIDTH}
        maxWidth={POPUP_WIDTH}
        // Clears the toolbar buttons that float over the top of the map on phones.
        autoPanPaddingTopLeft={[24, 72]}
        autoPanPaddingBottomRight={[24, 24]}
      >
        <PlacePopup location={location} actions={actions} />
      </Popup>
    </Marker>
  );
}

/** Rebuilds cluster icons when places change, since a cluster's icon depends on its places' icons. */
function RefreshClusters({ clusters, locations }: { clusters: RefObject<LeafletClusterGroup | null>; locations: readonly Location[] }) {
  useEffect(() => {
    clusters.current?.refreshClusters();
  }, [clusters, locations]);

  return null;
}

export interface PreviewPlace {
  position: LatLngTuple;
  icon: LocationIcon;
}

interface PlacesMapProps {
  locations: readonly Location[];
  /** Places that just arrived, with each one's drop-in delay in ms. */
  arrivals: ReadonlyMap<string, number>;
  selectedId: string | null;
  hoveredId: string | null;
  /** Where the place being added or moved would go. */
  preview: PreviewPlace | null;
  focus: MapFocus | null;
  /** Clicking empty map picks a spot. Absent where clicks don't pick (touch, the import page). */
  onPick?: (latitude: number, longitude: number) => void;
  actions?: PlaceActions;
  /** A place's popup opened (it's now selected) or closed. */
  onPlaceOpen: (id: string) => void;
  onPlaceClose: (id: string) => void;
  mapRef?: Ref<LeafletMap>;
  children?: ReactNode;
}

function pinState(id: string, selectedId: string | null, hoveredId: string | null): PinState {
  if (id === selectedId) return "selected";

  if (id === hoveredId) return "hover";

  return "rest";
}

/** The user's places as pins and clusters on the basemap, with popups, a preview pin and click-to-pick. */
export function PlacesMap(props: PlacesMapProps) {
  // Only the first view is computed: later changes to the places must not yank the map around.
  const [view] = useState(() => placesView(props.locations));
  const [animateClusters] = useState(() => !prefersReducedMotion());
  const markers = useRef(new Map<string, LeafletMarker>());
  const clusters = useRef<LeafletClusterGroup>(null);
  const previewIcon = props.preview?.icon;
  const preview = useMemo(() => (previewIcon ? previewPin(previewIcon) : null), [previewIcon]);

  return (
    <BaseMap view={view} scaleBar mapRef={props.mapRef} className={`places-map ${props.onPick ? "is-picking" : ""}`}>
      {props.onPick && <PickOnClick onPick={props.onPick} />}

      <MarkerClusterGroup ref={clusters} animate={animateClusters}>
        {props.locations.map((location) => (
          <PlaceMarker
            key={location.id}
            location={location}
            state={pinState(location.id, props.selectedId, props.hoveredId)}
            dropDelay={props.arrivals.get(location.id)}
            actions={props.actions}
            markers={markers}
            onOpen={props.onPlaceOpen}
            onClose={props.onPlaceClose}
          />
        ))}
      </MarkerClusterGroup>

      {props.preview && preview && (
        <Marker position={props.preview.position} icon={preview} interactive={false} keyboard={false} />
      )}

      {/* Last, so the markers are in their cluster group before a focus request looks for them. */}
      <RefreshClusters clusters={clusters} locations={props.locations} />
      <FocusController focus={props.focus} markers={markers} clusters={clusters} />
      {props.children}
    </BaseMap>
  );
}
