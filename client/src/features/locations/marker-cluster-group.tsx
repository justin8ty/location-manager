import { createElementObject, createLayerComponent, extendContext, type LayerProps } from "@react-leaflet/core";
import type { LocationIcon } from "@location-manager/shared";
import L, { type Marker, type MarkerCluster, type MarkerClusterGroup as LeafletClusterGroup } from "leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import type { ReactNode } from "react";
import { clusterPin } from "./pins";

/** Each place marker's icon, so a cluster can tell whether its places share one. */
export const markerPlaceIcons = new WeakMap<Marker, LocationIcon>();

function clusterIcon(cluster: MarkerCluster) {
  const icons = cluster.getAllChildMarkers().map((marker) => markerPlaceIcons.get(marker) ?? "pin");

  return clusterPin(icons);
}

interface MarkerClusterGroupProps extends LayerProps {
  animate: boolean;
  children: ReactNode;
}

/** Clusters the `<Marker>`s inside it (leaflet.markercluster). Clicking a cluster zooms to its pins. */
export const MarkerClusterGroup = createLayerComponent<LeafletClusterGroup, MarkerClusterGroupProps>(
  function createMarkerClusterGroup({ animate }, context) {
    // The plugin extends Leaflet's namespace when imported, so it's reached through `L` at call time.
    const group = L.markerClusterGroup({
      iconCreateFunction: clusterIcon,
      maxClusterRadius: 44,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      animate,
    });

    return createElementObject(group, extendContext(context, { layerContainer: group }));
  },
);
