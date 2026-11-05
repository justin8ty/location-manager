import { Button } from "@cloudflare/kumo";
import { FileZipIcon } from "@phosphor-icons/react";
import { type ChangeEvent, type DragEvent, useRef, useState } from "react";

interface ZipDropzoneProps {
  /** The file being uploaded, if any; the zone is disabled meanwhile. */
  uploadingFileName: string | null;
  onFile: (file: File) => void;
  /** Called when more than one file is dropped at once. */
  onMultipleFiles: () => void;
}

/** Accepts one ZIP file, dropped onto the zone or chosen with the button. */
export function ZipDropzone({ uploadingFileName, onFile, onMultipleFiles }: ZipDropzoneProps) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const uploading = uploadingFileName !== null;

  function accept(files: FileList) {
    const [file] = files;

    if (!file) return;

    if (files.length > 1) onMultipleFiles();
    else onFile(file);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = uploading ? "none" : "copy";
    setDragging(!uploading);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    // Moving between the zone's own children fires dragleave too.
    const next = event.relatedTarget;

    if (next instanceof Node && event.currentTarget.contains(next)) return;

    setDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);

    if (!uploading) accept(event.dataTransfer.files);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) accept(event.target.files);

    // Lets the same file be chosen again, e.g. after fixing it.
    event.target.value = "";
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-dragging={dragging || undefined}
      className="flex flex-col gap-4 rounded-xl border border-dashed border-kumo-interact bg-kumo-elevated p-5 transition-colors duration-150 data-dragging:border-kumo-brand data-dragging:bg-kumo-info-tint sm:flex-row sm:items-center sm:p-6"
    >
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-kumo-base text-kumo-subtle ring ring-kumo-line">
          <FileZipIcon size={24} />
        </div>
        <div className="flex min-w-0 flex-col gap-0.5" aria-live="polite">
          {uploading ? (
            <>
              <span className="font-medium text-kumo-default">Uploading</span>
              <span className="text-sm break-all text-kumo-subtle">{uploadingFileName}</span>
            </>
          ) : (
            <>
              {/* Touch screens can't drag files in. */}
              <span className="font-medium text-kumo-default">
                <span className="[@media(hover:none)]:hidden">Drop a ZIP file here</span>
                <span className="[@media(hover:hover)]:hidden">Choose a ZIP file</span>
              </span>
              <span className="text-sm text-kumo-subtle">One .txt file inside, up to 5 MB</span>
            </>
          )}
        </div>
      </div>

      <Button variant="secondary" className="self-start sm:self-auto" loading={uploading} onClick={() => input.current?.click()}>
        Choose file
      </Button>
      <input ref={input} type="file" accept=".zip,application/zip" hidden onChange={handleChange} />
    </div>
  );
}
