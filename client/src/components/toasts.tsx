import { Toast } from "@cloudflare/kumo/primitives/toast";
import { XIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { buttonClassName } from "./button";

const TOAST_LIMIT = 3;

/**
 * Toasts float over the map frame: bottom-centre on wider screens, under the floating map buttons on phones.
 * Both positions are derived from the layout variables in index.css.
 */
const VIEWPORT =
  "fixed z-50 flex flex-col gap-2 pointer-events-none " +
  "top-[72px] right-4 left-4 " +
  "tablet:top-auto tablet:bottom-[calc(var(--pane-gap)+16px)] tablet:left-[calc(var(--rail-width)+var(--column-width)+4px+16px)] tablet:right-[calc(var(--pane-gap)+16px)] tablet:flex-col-reverse tablet:items-center";

function ToastList() {
  const { toasts } = Toast.useToastManager();

  return toasts.map((toast) => {
    const bar = toast.type === "error" ? "border-l-accent" : "border-l-ink";

    return (
      <Toast.Root
        key={toast.id}
        toast={toast}
        className={`pointer-events-auto relative flex w-full items-start gap-3 rounded-[10px] border border-l-3 border-rule bg-field py-2.5 pr-1.5 pl-4 shadow-float transition-[opacity,translate] duration-150 ease-out data-ending-style:translate-y-2 data-ending-style:opacity-0 data-starting-style:translate-y-2 data-starting-style:opacity-0 tablet:max-w-[400px] ${bar}`}
      >
        <Toast.Content className="flex min-w-0 flex-1 flex-col py-0.5">
          <Toast.Title className="text-body font-medium text-ink" />
          <Toast.Description className="text-meta break-words text-ink-2" />
        </Toast.Content>
        {toast.actionProps && <Toast.Action className={`${buttonClassName({ variant: "secondary" })} self-center`} />}
        <Toast.Close
          aria-label="Dismiss"
          className="flex size-(--tap) shrink-0 items-center justify-center rounded-md text-ink-2 transition-colors duration-[120ms] hover:bg-hover hover:text-ink"
        >
          <XIcon size={16} aria-hidden />
        </Toast.Close>
      </Toast.Root>
    );
  });
}

/** Provides toasts to the app and renders them (announced through Base UI's live region). */
export function ToastRegion({ children }: { children: ReactNode }) {
  return (
    <Toast.Provider limit={TOAST_LIMIT}>
      {children}
      <Toast.Portal>
        <Toast.Viewport className={VIEWPORT}>
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}
