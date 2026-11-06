import type { LocationIcon } from "@location-manager/shared";
import type { LatLngTuple } from "leaflet";
import { Marker } from "react-leaflet";
import { BaseMap, StaticAttribution } from "../locations/base-map";
import { placePin } from "../locations/pins";

interface DecorativePlace {
  name: string;
  position: LatLngTuple;
  icon: LocationIcon;
  selected?: boolean;
}

const PLACES: DecorativePlace[] = [
  { name: "Suria KLCC", position: [3.1579, 101.7123], icon: "shop", selected: true },
  { name: "Zoo Negara", position: [3.2102, 101.7584], icon: "animals" },
  { name: "Batu Caves", position: [3.2379, 101.684], icon: "nature" },
  { name: "Masjid Negara", position: [3.142, 101.6918], icon: "mosque" },
  { name: "Thean Hou Temple", position: [3.1215, 101.6872], icon: "temple" },
  { name: "Taman Tasik Titiwangsa", position: [3.1786, 101.7059], icon: "park" },
  { name: "Bangsar kopi", position: [3.1295, 101.6705], icon: "cafe" },
];

const PINS = PLACES.map((place) => ({
  ...place,
  pin: placePin({ icon: place.icon, label: place.name, state: place.selected ? "selected" : "rest" }),
}));

const VIEW = { center: [3.172, 101.708] satisfies LatLngTuple, zoom: 12 };

/**
 * The login and register pages' backdrop: Kuala Lumpur with a few example places, slowly drifting
 * (one loop a minute) unless reduced motion is on. Nothing on it is interactive.
 */
export default function DecorativeMap() {
  return (
    <>
      {/* Larger than the frame, so drifting never shows an edge. */}
      <div className="drift-x absolute -inset-16">
        <div className="drift-y size-full">
          <BaseMap view={VIEW} interactive={false} attribution={false}>
            {PINS.map(({ name, position, pin }) => (
              <Marker key={name} position={position} icon={pin} interactive={false} keyboard={false} />
            ))}
          </BaseMap>
        </div>
      </div>
      <StaticAttribution />
    </>
  );
}
