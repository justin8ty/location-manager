/** The product mark: a quartered square with the accent dot in the top-right quarter (DESIGN.md: Naming). */
export function Mark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" aria-hidden="true" className="shrink-0">
      <rect x="1" y="1" width="24" height="24" rx="6" fill="none" stroke="var(--chrome)" strokeWidth="2" />
      <path d="M13 2v22M2 13h22" stroke="var(--ink-2)" strokeWidth="1" />
      <circle cx="18.5" cy="7.5" r="2.4" fill="var(--accent)" />
    </svg>
  );
}

/** The mark on its ink tile, for light backgrounds (as in the favicon). */
export function MarkTile() {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-[9px] bg-ink">
      <Mark size={24} />
    </span>
  );
}
