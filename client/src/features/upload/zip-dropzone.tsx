import { FileZipIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { type ChangeEvent, useRef } from "react";
import { Button } from "../../components/button";
import { useFileDrop } from "./use-file-drop";

interface ZipDropzoneProps {
  /** The file being imported, if any; the zone is disabled meanwhile. */
  importingFileName: string | null;
  onFiles: (files: FileList) => void;
}

/** Accepts one ZIP file, dropped onto the zone or chosen with the button. */
export function ZipDropzone({ importingFileName, onFiles }: ZipDropzoneProps) {
  const input = useRef<HTMLInputElement>(null);
  const importing = importingFileName !== null;
  const { dragging, handlers } = useFileDrop(onFiles, importing);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) onFiles(event.target.files);

    // Lets the same file be chosen again, e.g. after fixing it.
    event.target.value = "";
  }

  return (
    <div
      {...handlers}
      data-dragging={dragging || undefined}
      className="flex min-h-[176px] flex-col items-center justify-center gap-3 rounded-[10px] border border-dashed border-[#c9bfae] bg-field p-5 text-center transition-colors duration-[120ms] data-dragging:border-accent data-dragging:bg-accent-wash"
    >
      <FileZipIcon size={32} className="text-ink-2" aria-hidden />
      <div className="flex flex-col" aria-live="polite">
        {importing ? (
          <>
            <span className="font-medium text-ink">Importing</span>
            <span className="text-meta break-all text-ink-2">{importingFileName}</span>
          </>
        ) : (
          <>
            {/* Touch screens can't drag files in. */}
            <span className="font-medium text-ink">
              <span className="[@media(hover:none)]:hidden">Drop a ZIP file here</span>
              <span className="[@media(hover:hover)]:hidden">Choose a ZIP file</span>
            </span>
            <span className="text-meta text-ink-2">One .txt file inside, up to 5 MB</span>
          </>
        )}
      </div>
      <Button icon={UploadSimpleIcon} loading={importing} onClick={() => input.current?.click()}>
        Choose file
      </Button>
      <input ref={input} type="file" accept=".zip,application/zip" hidden onChange={handleChange} />
    </div>
  );
}
