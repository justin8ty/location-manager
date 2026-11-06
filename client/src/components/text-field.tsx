import type { ComponentPropsWithRef, ReactNode } from "react";

interface TextFieldProps extends ComponentPropsWithRef<"input"> {
  label: string;
  invalid?: boolean;
  /** Monospace with aligned digits, for coordinates. */
  mono?: boolean;
  /** A control inside the input's right edge, e.g. a show-password toggle. */
  trailing?: ReactNode;
}

/** A 44px input under a caps label. Invalid inputs get an accent border. */
export function TextField({
  label,
  invalid = false,
  mono = false,
  trailing,
  className = "",
  ...inputProps
}: TextFieldProps) {
  return (
    <label className={`flex min-w-0 flex-col gap-1 ${className}`}>
      <span className="caps">{label}</span>
      <span className="relative flex">
        <input
          aria-invalid={invalid || undefined}
          className={`h-(--tap) w-full min-w-0 rounded-md border bg-field text-input text-ink transition-colors duration-[120ms] placeholder:text-ink-3 ${invalid ? "border-accent" : "border-rule hover:border-[#c9bfae]"} ${trailing ? "pr-12" : ""} ${mono ? "coords px-2.5" : "px-3"}`}
          {...inputProps}
        />
        {trailing && <span className="absolute inset-y-0 right-0 flex">{trailing}</span>}
      </span>
    </label>
  );
}
