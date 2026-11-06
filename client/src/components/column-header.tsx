import type { ReactNode } from "react";

interface ColumnHeaderProps {
  title: string;
  /** Sits at the header's right edge, e.g. a button. */
  children?: ReactNode;
}

/** The title bar above a page's column: 68px beside the map, a slimmer 44px in the phone's sheet. */
export function ColumnHeader({ title, children }: ColumnHeaderProps) {
  return (
    <header className="flex h-[44px] items-center justify-between gap-3 px-5 tablet:h-[68px]">
      <h1 className="text-heading text-ink tablet:text-title">{title}</h1>
      {children}
    </header>
  );
}
