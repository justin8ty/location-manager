import { FileZipIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { useFileDrop } from "../features/upload/use-file-drop";

interface MapFrameProps {
  children: ReactNode;
  /** Accepts ZIP files dropped anywhere on the frame. */
  onFilesDropped?: (files: FileList) => void;
  /** Ignores drops, e.g. while an import is running. */
  dropDisabled?: boolean;
  className?: string;
}

/**
 * The inset window the map sits in (DESIGN.md: Layout, Map frame). The inner shadow is drawn above the
 * map's panes, and `isolate` keeps Leaflet's z-indexes from competing with dialogs and toasts.
 */
export function MapFrame({ children, onFilesDropped, dropDisabled = false, className = "" }: MapFrameProps) {
  const { dragging, handlers } = useFileDrop((files) => onFilesDropped?.(files), dropDisabled || !onFilesDropped);

  return (
    <div
      {...handlers}
      className={`relative isolate min-h-0 flex-1 overflow-hidden rounded-[16px] border border-[#c9bfae] bg-land shadow-[0_0_0_4px_var(--rule-2)] after:pointer-events-none after:absolute after:inset-0 after:z-[1000] after:rounded-[inherit] after:shadow-[inset_0_1px_3px_rgb(40_30_20/.14)] tablet:rounded-[14px] ${className}`}
    >
      {children}
      {dragging && (
        <div className="pointer-events-none absolute inset-0 z-[1100] flex items-center justify-center bg-[rgb(31_28_24/.35)]">
          <div className="flex items-center gap-3 rounded-[10px] border border-rule bg-field px-5 py-4 shadow-float">
            <FileZipIcon size={24} className="text-accent" aria-hidden />
            <span className="text-heading text-ink">Drop to import</span>
          </div>
        </div>
      )}
    </div>
  );
}
