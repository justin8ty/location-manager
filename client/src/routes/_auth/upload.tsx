import type { Location } from "@location-manager/shared";
import { CaretDownIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { Map as LeafletMap } from "leaflet";
import { useState } from "react";
import type { SheetSnap } from "../../components/bottom-sheet";
import { Workspace } from "../../components/workspace";
import { formatPlaceCount } from "../../features/locations/format";
import { FloatingMapControls, MapToolbar } from "../../features/locations/map-controls";
import { PLACE_ICONS } from "../../features/locations/place-icons";
import { type MapFocus, PlacesMap } from "../../features/locations/places-map";
import { locationsQuery } from "../../features/locations/queries";
import { useArrivals } from "../../features/locations/use-arrivals";
import { useZipImport } from "../../features/upload/use-zip-import";
import { ZipDropzone } from "../../features/upload/zip-dropzone";
import { ApiError } from "../../lib/api";
import { useIsMobile } from "../../lib/use-media-query";

export const Route = createFileRoute("/_auth/upload")({
  component: UploadPage,
});

const SAMPLE = `Name, Latitude, Longitude
Suria KLCC,3.157324409,101.7121981
Zoo Negara,3.21054160,101.75920504
Pavilion, Bukit Bintang,3.149,101.713`;

const FORMAT_RULES = [
  "The ZIP holds exactly one .txt file (a subfolder is fine). The text file can be up to 1 MB.",
  "The header row is optional, and spaces around values are ignored.",
  "Names can contain commas: the last two values on a line are always the latitude and longitude.",
  "If any line is invalid, nothing is saved, so you can fix the file and import it again.",
];

const LISTED_IMPORTS = 5;

function FormatHelp() {
  return (
    <details className="group rounded-[10px] border border-rule bg-field">
      <summary className="flex h-(--tap) cursor-pointer list-none items-center justify-between rounded-[10px] px-4 font-medium text-ink transition-colors duration-[120ms] hover:bg-hover [&::-webkit-details-marker]:hidden">
        File format
        <CaretDownIcon size={16} aria-hidden className="text-ink-2 transition-transform duration-[120ms] group-open:rotate-180" />
      </summary>
      <div className="flex flex-col gap-3 border-t border-rule px-4 pt-3 pb-4">
        <p className="text-meta text-ink-2">Each line holds a name, a latitude and a longitude, separated by commas.</p>
        <pre className="overflow-x-auto rounded-md bg-chrome px-3 py-2.5 font-mono text-[12px] leading-5 text-ink">{SAMPLE}</pre>
        <ul className="flex list-disc flex-col gap-1.5 pl-4 text-meta text-ink marker:text-ink-3">
          {FORMAT_RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </div>
    </details>
  );
}

function ImportedList({ locations }: { locations: readonly Location[] }) {
  const more = locations.length - LISTED_IMPORTS;

  return (
    <ul className="flex flex-col gap-1">
      {locations.slice(0, LISTED_IMPORTS).map((location) => {
        const IconComponent = PLACE_ICONS[location.icon].component;

        return (
          <li key={location.id} className="flex min-w-0 items-center gap-2 text-meta text-ink">
            <IconComponent size={16} aria-hidden className="shrink-0 text-ink-2" />
            <span className="truncate">{location.name}</span>
          </li>
        );
      })}
      {more > 0 && <li className="pl-6 text-meta text-ink-2">and {more} more</li>}
    </ul>
  );
}

/** The outcome of the last import, kept in the column after its toast has gone. */
function LastImport({ upload }: { upload: ReturnType<typeof useZipImport>["upload"] }) {
  const fileName = upload.variables?.name;

  if (upload.isSuccess) {
    return (
      <div role="status" className="flex flex-col gap-2 rounded-[10px] border border-rule bg-field p-4">
        <p className="font-medium break-words text-ink">
          Added {formatPlaceCount(upload.data.count)} from {fileName}
        </p>
        <ImportedList locations={upload.data.locations} />
      </div>
    );
  }

  if (upload.isError) {
    const details = upload.error instanceof ApiError ? upload.error.details : [];

    return (
      <div role="alert" className="flex flex-col gap-2 rounded-[10px] border border-accent bg-field p-4">
        <p className="font-medium break-words text-accent">Couldn't import {fileName}</p>
        <p className="text-meta text-ink">{upload.error.message}</p>
        {details.length > 0 && (
          <ul className="flex flex-col gap-0.5 font-mono text-[12px] leading-[18px] break-words text-ink-2">
            {details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return null;
}

function UploadPage() {
  const locations = useQuery(locationsQuery);
  const mobile = useIsMobile();
  const arrivals = useArrivals(locations.data);
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [focus, setFocus] = useState<MapFocus | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetSnap, setSheetSnap] = useState<SheetSnap>("half");

  const { upload, importFiles } = useZipImport({
    offerViewOnMap: true,
    onImported: (imported) => {
      setFocus({ kind: "fit", locations: imported });
    },
  });

  const places = locations.data ?? [];
  const mapReady = locations.data !== undefined || locations.isError;

  const column = (
    <div className="flex flex-col tablet:h-full tablet:min-h-0">
      <header className={`flex h-[68px] shrink-0 items-center bg-chrome px-5 ${mobile ? "sticky top-0 z-10" : ""}`}>
        <h1 className="text-title text-ink">Import</h1>
      </header>
      <div className="flex flex-col gap-3 px-5 pb-5 tablet:min-h-0 tablet:flex-1 tablet:overflow-y-auto">
        <ZipDropzone importingFileName={upload.isPending ? upload.variables.name : null} onFiles={importFiles} />
        <FormatHelp />
        {!upload.isPending && <LastImport upload={upload} />}
      </div>
    </div>
  );

  const frame = mapReady && (
    <>
      <PlacesMap
        locations={places}
        arrivals={arrivals}
        selectedId={selectedId}
        hoveredId={null}
        preview={null}
        focus={focus}
        onPlaceOpen={setSelectedId}
        onPlaceClose={(id) => setSelectedId((current) => (current === id ? null : current))}
        mapRef={setMap}
      />
      {mobile && <FloatingMapControls map={map} locations={places} />}
    </>
  );

  return (
    <Workspace
      column={column}
      columnLabel="Import"
      toolbar={<MapToolbar map={map} locations={places} />}
      frame={frame}
      onFilesDropped={importFiles}
      dropDisabled={upload.isPending}
      sheetSnap={sheetSnap}
      onSheetSnapChange={setSheetSnap}
    />
  );
}
