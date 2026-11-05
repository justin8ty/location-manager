import { Banner, Link, Text, useKumoToastManager } from "@cloudflare/kumo";
import { CheckCircleIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import { formatLocationCount } from "../../features/locations/format";
import { UPLOAD_TOAST_MS, useUploadLocations } from "../../features/upload/use-upload-locations";
import { ZipDropzone } from "../../features/upload/zip-dropzone";
import { ApiError } from "../../lib/api";

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
  "If any line is invalid, nothing is saved, so you can fix the file and upload it again.",
];

/** The outcome of the last upload, kept on the page after its toast has gone. */
function LastUpload({ upload }: { upload: ReturnType<typeof useUploadLocations> }) {
  const fileName = upload.variables?.name;

  if (upload.isSuccess) {
    return (
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-kumo-default" role="status">
        <CheckCircleIcon size={18} weight="fill" className="shrink-0 text-kumo-success" />
        <span>
          Added {formatLocationCount(upload.data.count)} from <span className="break-all">{fileName}</span>.
        </span>
        <Link href="/map">View on map</Link>
      </p>
    );
  }

  if (upload.isError) {
    const details = upload.error instanceof ApiError ? upload.error.details : [];

    return (
      <Banner
        variant="error"
        icon={<WarningCircleIcon weight="fill" />}
        title={`Couldn't upload ${fileName}`}
        description={
          <div className="flex flex-col gap-2">
            <span>{upload.error.message}</span>
            {details.length > 0 && (
              <ul className="flex flex-col gap-0.5 font-mono text-xs">
                {details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            )}
          </div>
        }
      />
    );
  }

  return null;
}

function UploadPage() {
  const upload = useUploadLocations();
  const toasts = useKumoToastManager();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-6 md:px-8 md:py-12">
      <header className="flex flex-col gap-1">
        <Text variant="heading2" as="h1">
          Upload locations
        </Text>
        <Text variant="secondary">Add many locations at once from a ZIP file containing one text file.</Text>
      </header>

      <div className="flex flex-col gap-4">
        <ZipDropzone
          uploadingFileName={upload.isPending ? upload.variables.name : null}
          onFile={(file) => upload.mutate(file)}
          onMultipleFiles={() =>
            toasts.add({ variant: "error", title: "Upload one ZIP file at a time", timeout: UPLOAD_TOAST_MS })
          }
        />
        {!upload.isPending && <LastUpload upload={upload} />}
      </div>

      <section aria-labelledby="file-format-heading" className="flex flex-col gap-3">
        <Text variant="heading3" as="h2" id="file-format-heading">
          File format
        </Text>
        <Text variant="secondary">Each line holds a name, a latitude and a longitude, separated by commas.</Text>
        <pre className="overflow-x-auto rounded-lg bg-kumo-recessed p-4 font-mono text-sm leading-relaxed text-kumo-default">
          {SAMPLE}
        </pre>
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-base text-kumo-default marker:text-kumo-subtle">
          {FORMAT_RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
