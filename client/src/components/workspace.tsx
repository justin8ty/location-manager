import type { ReactNode } from "react";
import { useIsMobile } from "../lib/use-media-query";
import { BottomSheet, type SheetSnap } from "./bottom-sheet";
import { MapFrame } from "./map-frame";

interface WorkspaceProps {
  /** What the page shows beside the map; on phones, in the bottom sheet. */
  column: ReactNode;
  columnLabel: string;
  /** The bar above the map frame on wider screens. */
  toolbar: ReactNode;
  /** The map, and anything floating over it. */
  frame: ReactNode;
  onFilesDropped?: (files: FileList) => void;
  dropDisabled?: boolean;
  sheetSnap: SheetSnap;
  onSheetSnapChange: (snap: SheetSnap) => void;
}

/**
 * A signed-in page's layout (DESIGN.md: Layout): the column beside a toolbar and the map frame, or on
 * phones the map frame above a bottom sheet.
 */
export function Workspace(props: WorkspaceProps) {
  const mobile = useIsMobile();

  const frame = (
    <MapFrame onFilesDropped={props.onFilesDropped} dropDisabled={props.dropDisabled}>
      {props.frame}
    </MapFrame>
  );

  if (mobile) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex min-h-0 flex-1 flex-col p-2">{frame}</div>
        <BottomSheet snap={props.sheetSnap} onSnapChange={props.onSheetSnapChange} label={props.columnLabel}>
          {props.column}
        </BottomSheet>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <aside aria-label={props.columnLabel} className="flex w-(--column-width) shrink-0 flex-col">
        {props.column}
      </aside>
      <section className="flex min-w-0 flex-1 flex-col pr-(--pane-gap) pb-(--pane-gap) pl-1">
        <div className="flex h-[68px] shrink-0 items-center">{props.toolbar}</div>
        {frame}
      </section>
    </div>
  );
}
