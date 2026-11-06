import { Loader } from "@cloudflare/kumo";
import type { Icon } from "@phosphor-icons/react";
import type { ComponentPropsWithRef } from "react";

export type ButtonVariant = "primary" | "secondary" | "quiet";

const BASE =
  "inline-flex h-(--tap) shrink-0 items-center justify-center gap-2 rounded-md border text-body font-medium whitespace-nowrap select-none " +
  "[transition:background-color_120ms_ease,border-color_120ms_ease,color_120ms_ease,box-shadow_60ms_ease,translate_60ms_ease] " +
  "enabled:active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 [&[href]]:active:translate-y-px";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "border-accent-ink bg-accent text-white shadow-[inset_0_-2px_0_rgb(0_0_0/.16)] hover:bg-accent-ink active:shadow-[inset_0_2px_0_rgb(0_0_0/.16)]",
  secondary: "border-rule bg-field text-ink hover:bg-hover",
  quiet: "border-transparent bg-transparent text-ink-2 hover:bg-hover hover:text-ink",
};

interface ButtonLookOptions {
  variant: ButtonVariant;
  /** A 44px square holding only an icon. */
  square?: boolean;
}

/** Button styling, for links that look like buttons. */
export function buttonClassName({ variant, square = false }: ButtonLookOptions): string {
  return `${BASE} ${VARIANTS[variant]} ${square ? "w-(--tap)" : "px-4"}`;
}

interface ButtonProps extends ComponentPropsWithRef<"button"> {
  variant?: ButtonVariant;
  square?: boolean;
  icon?: Icon;
  /** Swaps the icon for a spinner and disables the button, keeping its label and width. */
  loading?: boolean;
}

export function Button({
  variant = "secondary",
  square = false,
  icon: IconComponent,
  loading = false,
  className = "",
  type = "button",
  disabled,
  children,
  ...props
}: ButtonProps) {
  let icon = IconComponent ? <IconComponent size={18} aria-hidden /> : null;

  if (loading) icon = <Loader size={18} aria-label="Working" />;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${buttonClassName({ variant, square })} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
