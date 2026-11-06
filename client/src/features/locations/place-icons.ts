import { type LocationIcon, locationIconSchema } from "@location-manager/shared";
import {
  BriefcaseIcon,
  BuildingsIcon,
  CoffeeIcon,
  FlowerLotusIcon,
  ForkKnifeIcon,
  HouseIcon,
  type Icon,
  MapPinIcon,
  MosqueIcon,
  MountainsIcon,
  PawPrintIcon,
  ShoppingBagIcon,
  TreeIcon,
} from "@phosphor-icons/react";
import briefcaseFill from "@phosphor-icons/core/fill/briefcase-fill.svg?raw";
import buildingsFill from "@phosphor-icons/core/fill/buildings-fill.svg?raw";
import coffeeFill from "@phosphor-icons/core/fill/coffee-fill.svg?raw";
import flowerLotusFill from "@phosphor-icons/core/fill/flower-lotus-fill.svg?raw";
import forkKnifeFill from "@phosphor-icons/core/fill/fork-knife-fill.svg?raw";
import houseFill from "@phosphor-icons/core/fill/house-fill.svg?raw";
import mapPinFill from "@phosphor-icons/core/fill/map-pin-fill.svg?raw";
import mosqueFill from "@phosphor-icons/core/fill/mosque-fill.svg?raw";
import mountainsFill from "@phosphor-icons/core/fill/mountains-fill.svg?raw";
import pawPrintFill from "@phosphor-icons/core/fill/paw-print-fill.svg?raw";
import shoppingBagFill from "@phosphor-icons/core/fill/shopping-bag-fill.svg?raw";
import treeFill from "@phosphor-icons/core/fill/tree-fill.svg?raw";

interface PlaceIcon {
  /** The category name shown in menus, filters and popups. */
  label: string;
  /** For React UI: tiles, the picker, the list. */
  component: Icon;
  /** The fill-weight SVG markup, for pins and clusters (Leaflet markers are plain HTML). */
  fillSvg: string;
}

export const PLACE_ICONS: Record<LocationIcon, PlaceIcon> = {
  pin: { label: "Place", component: MapPinIcon, fillSvg: mapPinFill },
  home: { label: "Home", component: HouseIcon, fillSvg: houseFill },
  work: { label: "Work", component: BriefcaseIcon, fillSvg: briefcaseFill },
  food: { label: "Food", component: ForkKnifeIcon, fillSvg: forkKnifeFill },
  cafe: { label: "Café", component: CoffeeIcon, fillSvg: coffeeFill },
  shop: { label: "Shopping", component: ShoppingBagIcon, fillSvg: shoppingBagFill },
  park: { label: "Park", component: TreeIcon, fillSvg: treeFill },
  nature: { label: "Nature", component: MountainsIcon, fillSvg: mountainsFill },
  animals: { label: "Animals", component: PawPrintIcon, fillSvg: pawPrintFill },
  temple: { label: "Temple", component: FlowerLotusIcon, fillSvg: flowerLotusFill },
  mosque: { label: "Mosque", component: MosqueIcon, fillSvg: mosqueFill },
  landmark: { label: "Landmark", component: BuildingsIcon, fillSvg: buildingsFill },
};

/** Every icon, in the order the picker shows them. */
export const PLACE_ICON_KEYS: readonly LocationIcon[] = locationIconSchema.options;
