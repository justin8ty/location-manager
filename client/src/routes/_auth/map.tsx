import type { Location, LocationIcon } from "@location-manager/shared";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { Map as LeafletMap } from "leaflet";
import { type ReactNode, type RefObject, useEffect, useEffectEvent, useRef, useState } from "react";
import type { SheetSnap } from "../../components/bottom-sheet";
import { Button, buttonClassName } from "../../components/button";
import { Workspace } from "../../components/workspace";
import { Composer, type PickMethod } from "../../features/locations/composer";
import { DeleteLocationDialog } from "../../features/locations/delete-location-dialog";
import { formatCoordinateInput } from "../../features/locations/format";
import {
  draftFromLocation,
  draftPosition,
  EMPTY_DRAFT,
  type LocationDraft,
} from "../../features/locations/location-draft";
import { FloatingMapControls, MapToolbar } from "../../features/locations/map-controls";
import { CategoryChips, filterPlaces, PlaceList, PlaceSearch, sortPlaces } from "../../features/locations/place-list";
import { type MapFocus, PlacesMap, type PreviewPlace } from "../../features/locations/places-map";
import { locationsQuery } from "../../features/locations/queries";
import { useArrivals } from "../../features/locations/use-arrivals";
import { useZipImport } from "../../features/upload/use-zip-import";
import { useIsMobile } from "../../lib/use-media-query";

export const Route = createFileRoute("/_auth/map")({
  component: MapPage,
});

function isTyping(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

function samePosition(location: Location, latitude: number, longitude: number): boolean {
  return location.latitude === latitude && location.longitude === longitude;
}

/** The crosshair phones aim with: pan the map under it, then tap Add here. */
function Crosshair() {
  return (
    <svg
      aria-hidden
      width="36"
      height="36"
      viewBox="0 0 36 36"
      className="pointer-events-none absolute top-1/2 left-1/2 z-[1001] -translate-x-1/2 -translate-y-1/2 text-ink"
    >
      <path d="M18 3v11M18 22v11M3 18h11M22 18h11" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
      <path d="M18 3v11M18 22v11M3 18h11M22 18h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="18" cy="18" r="2" fill="var(--accent)" stroke="#fff" strokeWidth="1" />
    </svg>
  );
}

function EmptyMapCard({ pickMethod }: { pickMethod: PickMethod }) {
  const prompt = pickMethod === "click" ? "Click anywhere to drop your first place, or " : "Pan to a spot and tap Add here, or ";

  return (
    <div className="pointer-events-none absolute inset-0 z-[1001] flex items-center justify-center p-6">
      <div className="pointer-events-auto max-w-[300px] rounded-[10px] border border-rule bg-field px-5 py-4 text-center shadow-float">
        <p className="text-heading text-ink">No places yet</p>
        <p className="mt-1 text-ink-2">
          {prompt}
          <Link to="/upload" className="font-medium text-accent-ink underline underline-offset-2">
            import a file
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

function LoadError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-[10px] border border-accent/40 bg-field p-4">
      <div>
        <p className="font-medium text-accent">Couldn't load your places</p>
        <p className="text-meta text-ink-2">{error.message}</p>
      </div>
      <Button onClick={onRetry}>Retry</Button>
    </div>
  );
}

function ColumnHeader({ count }: { count: number | undefined }) {
  return (
    <header className="flex h-[68px] items-center justify-between gap-3 px-5">
      <h1 className="text-title flex items-center gap-2 text-ink">
        Places
        {count !== undefined && (
          <span className="coords rounded-full bg-rule-2 px-2 text-meta font-medium text-ink-2">{count}</span>
        )}
      </h1>
      <Link to="/upload" className={buttonClassName({ variant: "secondary" })}>
        Import
      </Link>
    </header>
  );
}

function MapPage() {
  const locations = useQuery(locationsQuery);
  const mobile = useIsMobile();
  const pickMethod: PickMethod = mobile ? "add-here" : "click";
  const arrivals = useArrivals(locations.data);
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [draft, setDraft] = useState<LocationDraft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [focus, setFocus] = useState<MapFocus | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Location | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<LocationIcon | null>(null);
  const [sheetSnap, setSheetSnap] = useState<SheetSnap>("half");
  const nameInput = useRef<HTMLInputElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);

  const { upload, importFiles } = useZipImport({
    offerViewOnMap: false,
    onImported: (imported) => setFocus({ kind: "fit", locations: imported }),
  });

  const places = locations.data;
  const editing = places?.find((location) => location.id === editingId) ?? null;
  // A category whose last place was deleted no longer filters.
  const activeCategory = places?.some((location) => location.icon === category) ? category : null;
  const listed = places && filterPlaces(sortPlaces(places), query, activeCategory);
  const position = draftPosition(draft);
  let preview: PreviewPlace | null = position && { position, icon: draft.icon };

  // While editing, the preview only appears once the place is moved; its own pin already marks where it is.
  if (position && editing && samePosition(editing, position[0], position[1])) preview = null;

  function fillCoordinates(latitude: number, longitude: number) {
    setDraft((current) => ({
      ...current,
      latitude: formatCoordinateInput(latitude),
      longitude: formatCoordinateInput(longitude),
    }));

    // Go straight to naming the spot, unless it already has a name (e.g. it's being moved).
    if (draft.name === "") nameInput.current?.focus();
  }

  function addHere() {
    if (!map) return;

    setSheetSnap("full");
    const { lat, lng } = map.getCenter().wrap();
    fillCoordinates(lat, lng);
  }

  function startEdit(location: Location) {
    map?.closePopup();
    setEditingId(location.id);
    setDraft(draftFromLocation(location));
    setSheetSnap("full");
  }

  function stopEdit() {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
  }

  function showPlace(location: Location) {
    setSelectedId(location.id);
    setFocus({ kind: "place", id: location.id });
    setSheetSnap("half");
  }

  function handleSaved(location: Location) {
    stopEdit();
    showPlace(location);
  }

  function handleDeleted(location: Location) {
    if (location.id === editingId) stopEdit();
  }

  function handlePlaceOpen(id: string) {
    setSelectedId(id);
    setSheetSnap((snap) => (snap === "full" ? "half" : snap));
  }

  function handlePlaceClose(id: string) {
    setSelectedId((current) => (current === id ? null : current));
  }

  // Esc steps back one level at a time; `/` jumps to search (DESIGN.md: Keyboard and accessibility).
  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === "/" && !isTyping(event.target)) {
      event.preventDefault();
      searchInput.current?.focus();

      return;
    }

    // Menus and dialogs handle their own Esc and mark it handled.
    if (event.key !== "Escape" || event.defaultPrevented || pendingDelete) return;

    if (editing) stopEdit();
    else if (preview) setDraft((current) => ({ ...current, latitude: "", longitude: "" }));
    else if (selectedId) {
      map?.closePopup();
      setSelectedId(null);
    }
  });

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const column = (
    <MapColumn
      composer={
        <Composer
          key={editing?.id ?? "new"}
          draft={draft}
          onDraftChange={setDraft}
          editing={editing}
          onSaved={handleSaved}
          onCancelEdit={stopEdit}
          pickMethod={pickMethod}
          nameInputRef={nameInput}
        />
      }
      searchInput={searchInput}
      query={query}
      onQueryChange={setQuery}
      filters={
        places &&
        places.length > 0 && <CategoryChips locations={places} category={activeCategory} onCategoryChange={setCategory} />
      }
      list={
        locations.isError && !places ? (
          <LoadError error={locations.error} onRetry={() => void locations.refetch()} />
        ) : (
          <PlaceList
            locations={listed}
            hasPlaces={(places?.length ?? 0) > 0}
            query={query}
            arrivals={arrivals}
            selectedId={selectedId}
            onSelect={showPlace}
            onHover={setHoveredId}
          />
        )
      }
    />
  );

  // The first view fits the places, so the map waits for them (or for the load to fail).
  const mapReady = places !== undefined || locations.isError;

  const frame = mapReady && (
    <>
      <PlacesMap
        locations={places ?? []}
        arrivals={arrivals}
        selectedId={selectedId}
        hoveredId={hoveredId}
        preview={preview}
        focus={focus}
        onPick={mobile ? undefined : fillCoordinates}
        actions={{ onEdit: startEdit, onDelete: setPendingDelete }}
        onPlaceOpen={handlePlaceOpen}
        onPlaceClose={handlePlaceClose}
        mapRef={setMap}
      />
      {places?.length === 0 && !preview && <EmptyMapCard pickMethod={pickMethod} />}
      {mobile && (
        <>
          <FloatingMapControls map={map} locations={places ?? []} />
          {/* Aiming needs the map: not with the sheet at full height (the map is a sliver) or a place open. */}
          {sheetSnap !== "full" && selectedId === null && (
            <>
              <Crosshair />
              <div className="pointer-events-none absolute inset-x-0 bottom-5 z-[1001] flex justify-center">
                <Button variant="primary" className="pointer-events-auto shadow-float" disabled={!map} onClick={addHere}>
                  Add here
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </>
  );

  return (
    <>
      <Workspace
        column={column}
        columnHeader={<ColumnHeader count={places?.length} />}
        columnLabel="Places"
        toolbar={<MapToolbar map={map} locations={places ?? []} />}
        frame={frame}
        onFilesDropped={importFiles}
        dropDisabled={upload.isPending}
        sheetSnap={sheetSnap}
        onSheetSnapChange={setSheetSnap}
      />
      <DeleteLocationDialog
        location={pendingDelete}
        onClose={() => setPendingDelete(null)}
        onDeleted={handleDeleted}
      />
    </>
  );
}

interface MapColumnProps {
  composer: ReactNode;
  searchInput: RefObject<HTMLInputElement | null>;
  query: string;
  onQueryChange: (query: string) => void;
  filters: ReactNode;
  list: ReactNode;
}

/** Composer, search, filters and list. On wider screens only the list scrolls; in the sheet, all of it does. */
function MapColumn(props: MapColumnProps) {
  return (
    <div className="flex flex-col tablet:min-h-0 tablet:flex-1">
      <div className="flex flex-col px-5 tablet:min-h-0 tablet:flex-1">
        {props.composer}
        <div className="mt-2">
          <PlaceSearch query={props.query} onQueryChange={props.onQueryChange} inputRef={props.searchInput} />
        </div>
        {props.filters}
        <div className="-mx-2.5 mt-1 pb-4 tablet:min-h-0 tablet:flex-1 tablet:overflow-y-auto">
          <div className="px-2.5">{props.list}</div>
        </div>
      </div>
    </div>
  );
}
