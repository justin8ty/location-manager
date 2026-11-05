import { Link, Text } from "@cloudflare/kumo";
import type { Location } from "@location-manager/shared";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { PageError, PagePending } from "../../components/route-states";
import { DeleteLocationDialog } from "../../features/locations/delete-location-dialog";
import { formatCoordinate, formatLocationCount } from "../../features/locations/format";
import { draftPosition, EMPTY_DRAFT, type LocationDraft } from "../../features/locations/location-draft";
import { LocationForm } from "../../features/locations/location-form";
import { LocationMap } from "../../features/locations/location-map";
import { locationsQuery } from "../../features/locations/queries";

export const Route = createFileRoute("/_auth/map")({
  component: MapPage,
});

// On wide screens the panel floats over the map's top-left corner: md:left-3 + md:w-80.
const WIDE_SCREEN_QUERY = "(min-width: 48rem)";
const PANEL_INSET_PX = 12 + 320;

function MapPage() {
  const locations = useQuery(locationsQuery);

  // The map's first view fits the markers it opens with, so it waits for a current list: on the
  // first load, after an upload has invalidated the list, and while retrying a failed load.
  if (locations.isFetching && locations.isStale) return <PagePending />;

  if (locations.isError) {
    return (
      <PageError
        title="We couldn't load your locations"
        error={locations.error}
        onRetry={() => void locations.refetch()}
      />
    );
  }

  // Waiting to go back online.
  if (!locations.data) return <PagePending />;

  return <MapWorkspace locations={locations.data} />;
}

function MapWorkspace({ locations }: { locations: Location[] }) {
  const [draft, setDraft] = useState<LocationDraft>(EMPTY_DRAFT);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Location | null>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  const [leftInset] = useState(() => (window.matchMedia(WIDE_SCREEN_QUERY).matches ? PANEL_INSET_PX : 0));

  function pick(latitude: number, longitude: number) {
    setDraft((current) => ({ ...current, latitude: formatCoordinate(latitude), longitude: formatCoordinate(longitude) }));

    // With a mouse, go straight to naming the spot; on touch, focusing would cover the map with the keyboard.
    if (draft.name === "" && window.matchMedia("(pointer: fine)").matches) nameInput.current?.focus();
  }

  function handleCreated(location: Location) {
    setDraft(EMPTY_DRAFT);
    setFocusedId(location.id);
  }

  return (
    <div className="flex h-full flex-col md:relative">
      <div className="relative isolate min-h-0 flex-1">
        <LocationMap
          locations={locations}
          preview={draftPosition(draft)}
          focusedId={focusedId}
          leftInset={leftInset}
          onPick={pick}
          onDelete={setPendingDelete}
        />
      </div>

      <section
        aria-labelledby="add-location-heading"
        className="z-10 flex shrink-0 flex-col gap-4 border-t border-kumo-line bg-kumo-base p-4 md:absolute md:top-3 md:left-3 md:w-80 md:rounded-xl md:border-0 md:p-5 md:shadow-lg md:ring md:ring-kumo-line"
      >
        <header className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-3">
            <Text variant="heading3" as="h1" id="add-location-heading">
              Add location
            </Text>
            {locations.length > 0 && (
              <span className="text-sm text-kumo-subtle tabular-nums">{formatLocationCount(locations.length)}</span>
            )}
          </div>
          <Text variant="secondary">
            {locations.length === 0 ? (
              <>
                No locations yet. Click the map to pick a spot, or <Link href="/upload">upload a file</Link>.
              </>
            ) : (
              "Click the map to fill in the coordinates."
            )}
          </Text>
        </header>

        <LocationForm draft={draft} onDraftChange={setDraft} onCreated={handleCreated} nameInputRef={nameInput} />
      </section>

      <DeleteLocationDialog location={pendingDelete} onClose={() => setPendingDelete(null)} />
    </div>
  );
}
