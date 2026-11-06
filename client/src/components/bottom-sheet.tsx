import { type KeyboardEvent, type PointerEvent, type ReactNode, useRef, useState } from "react";

export type SheetSnap = "collapsed" | "half" | "full";

const SNAPS: readonly SheetSnap[] = ["collapsed", "half", "full"];
// The handle (h-6) plus a page's 68px header: collapsed shows the title and nothing under it.
const COLLAPSED_PX = 92;
const HALF_SHARE = 0.46;
const FULL_SHARE = 0.82;

// Further than this and a press on the handle is a drag, not a tap.
const DRAG_THRESHOLD_PX = 6;

/** A snap's height in px, given the height of the area the map and sheet share. */
function snapHeight(snap: SheetSnap, areaHeight: number): number {
  if (snap === "collapsed") return COLLAPSED_PX;

  return areaHeight * (snap === "half" ? HALF_SHARE : FULL_SHARE);
}

const SNAP_HEIGHTS: Record<SheetSnap, string> = {
  collapsed: `${COLLAPSED_PX}px`,
  half: `${HALF_SHARE * 100}%`,
  full: `${FULL_SHARE * 100}%`,
};

function nearestSnap(height: number, areaHeight: number): SheetSnap {
  let nearest: SheetSnap = "collapsed";

  for (const snap of SNAPS) {
    const distance = Math.abs(snapHeight(snap, areaHeight) - height);

    if (distance < Math.abs(snapHeight(nearest, areaHeight) - height)) nearest = snap;
  }

  return nearest;
}

function nextSnap(snap: SheetSnap): SheetSnap {
  return SNAPS[(SNAPS.indexOf(snap) + 1) % SNAPS.length] ?? "collapsed";
}

interface Drag {
  pointerId: number;
  startY: number;
  startHeight: number;
  height: number;
  moved: boolean;
}

interface BottomSheetProps {
  snap: SheetSnap;
  onSnapChange: (snap: SheetSnap) => void;
  /** Names the sheet for assistive technology. */
  label: string;
  /** Stays put above the scrolling content. */
  header: ReactNode;
  children: ReactNode;
}

/**
 * The phone layout's sheet below the map (DESIGN.md: Layout, Mobile). Drag the handle between three
 * heights, or tap it to cycle through them. The sheet sits in the page flow, so the map shrinks to fit.
 */
export function BottomSheet({ snap, onSnapChange, label, header, children }: BottomSheetProps) {
  const sheet = useRef<HTMLElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);

  // The sheet shares its parent's height with the map.
  function areaHeight(): number {
    return sheet.current?.parentElement?.clientHeight ?? window.innerHeight;
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!sheet.current) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    const height = sheet.current.offsetHeight;
    setDrag({ pointerId: event.pointerId, startY: event.clientY, startHeight: height, height, moved: false });
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!drag || drag.pointerId !== event.pointerId) return;

    const offset = drag.startY - event.clientY;
    const height = Math.min(Math.max(drag.startHeight + offset, COLLAPSED_PX), snapHeight("full", areaHeight()));
    setDrag({ ...drag, height, moved: drag.moved || Math.abs(offset) > DRAG_THRESHOLD_PX });
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (!drag || drag.pointerId !== event.pointerId) return;

    setDrag(null);
    onSnapChange(drag.moved ? nearestSnap(drag.height, areaHeight()) : nextSnap(snap));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    onSnapChange(nextSnap(snap));
  }

  return (
    <section
      ref={sheet}
      aria-label={label}
      style={{ height: drag?.moved ? `${drag.height}px` : SNAP_HEIGHTS[snap] }}
      className={`flex shrink-0 flex-col bg-chrome ${drag?.moved ? "" : "transition-[height] duration-200 ease-out motion-reduce:transition-none"}`}
    >
      <div
        role="button"
        tabIndex={0}
        aria-label={`Resize sheet (${snap})`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => setDrag(null)}
        onKeyDown={handleKeyDown}
        className="flex h-[24px] shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
      >
        <span className="h-1 w-9 rounded-full bg-rule" />
      </div>
      {/* Above the scroller in paint order, so the scroller's snapped edge can't show a sliver over it. */}
      <div className="relative z-10 shrink-0 bg-chrome">{header}</div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
    </section>
  );
}
