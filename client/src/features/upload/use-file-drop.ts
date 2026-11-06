import { type DragEvent, useState } from "react";

interface FileDropHandlers {
  onDragEnter: (event: DragEvent<HTMLElement>) => void;
  onDragOver: (event: DragEvent<HTMLElement>) => void;
  onDragLeave: (event: DragEvent<HTMLElement>) => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
}

interface FileDrop {
  /** Files are being dragged over the target. */
  dragging: boolean;
  handlers: FileDropHandlers;
}

function carriesFiles(event: DragEvent<HTMLElement>): boolean {
  return event.dataTransfer.types.includes("Files");
}

/** Lets an element accept dropped files. Drags of anything else (text, links) are ignored. */
export function useFileDrop(onFiles: (files: FileList) => void, disabled: boolean): FileDrop {
  const [dragging, setDragging] = useState(false);

  function handleDragOver(event: DragEvent<HTMLElement>) {
    if (!carriesFiles(event)) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = disabled ? "none" : "copy";
    setDragging(!disabled);
  }

  function handleDragLeave(event: DragEvent<HTMLElement>) {
    // Moving between the target's own children fires dragleave too.
    const next = event.relatedTarget;

    if (next instanceof Node && event.currentTarget.contains(next)) return;

    setDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    if (!carriesFiles(event)) return;

    event.preventDefault();
    setDragging(false);

    if (!disabled) onFiles(event.dataTransfer.files);
  }

  return {
    dragging,
    handlers: { onDragEnter: handleDragOver, onDragOver: handleDragOver, onDragLeave: handleDragLeave, onDrop: handleDrop },
  };
}
