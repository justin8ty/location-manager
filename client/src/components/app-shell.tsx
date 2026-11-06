import { Tooltip } from "@cloudflare/kumo";
import { Toast } from "@cloudflare/kumo/primitives/toast";
import type { User } from "@location-manager/shared";
import { type Icon, MapPinPlusIcon, MapTrifoldIcon, SignOutIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import type { MouseEvent, ReactNode } from "react";
import { useLogout } from "../features/auth/session";
import { usePlacesMode } from "../features/locations/places-mode";
import { Mark } from "./mark";

interface NavItem {
  to: "/map" | "/upload";
  label: string;
  icon: Icon;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/map", label: "Map", icon: MapTrifoldIcon },
  { to: "/upload", label: "Import", icon: UploadSimpleIcon },
];

const RAIL_ITEM =
  "flex size-11 items-center justify-center rounded-[10px] text-chrome/65 transition-colors duration-[120ms] hover:bg-white/8 hover:text-chrome active:translate-y-px";

const RAIL_ITEM_ACTIVE = "bg-white/14 text-chrome";

const TAB_ITEM =
  "flex flex-1 flex-col items-center justify-center gap-0.5 text-[12px] leading-4 font-medium text-chrome/65 transition-colors duration-[120ms] active:translate-y-px";

function useLogoutWithToast() {
  const logout = useLogout();
  const toasts = Toast.useToastManager();

  function run() {
    logout.mutate(undefined, {
      onError: (error) => toasts.add({ type: "error", title: "Couldn't log out", description: error.message }),
    });
  }

  return { run, pending: logout.isPending };
}

/** The desktop and tablet navigation: a 68px ink rail (DESIGN.md: Layout, Rail). */
function Rail({ user }: { user: User }) {
  const logout = useLogoutWithToast();

  return (
    <nav aria-label="Main" className="hidden w-(--rail-width) shrink-0 flex-col items-center gap-1 bg-ink py-3 tablet:flex">
      <Link to="/map" aria-label="JustNaik Places Manager" className="mb-4 flex size-11 items-center justify-center rounded-[10px]">
        <Mark />
      </Link>
      {NAV_ITEMS.map(({ to, label, icon: IconComponent }) => (
        <Tooltip key={to} content={label} side="right" asChild>
          <Link to={to} aria-label={label} className={RAIL_ITEM} activeProps={{ className: RAIL_ITEM_ACTIVE }}>
            <IconComponent size={22} aria-hidden />
          </Link>
        </Tooltip>
      ))}
      <div className="flex-1" />
      <Tooltip content="Log out" side="right" asChild>
        <button type="button" aria-label="Log out" disabled={logout.pending} onClick={logout.run} className={RAIL_ITEM}>
          <SignOutIcon size={22} aria-hidden />
        </button>
      </Tooltip>
      <Tooltip content={user.email} side="right" asChild>
        <span
          tabIndex={0}
          aria-label={`Signed in as ${user.email}`}
          className="mt-2 flex size-9 items-center justify-center rounded-md bg-[#3a352f] font-mono text-[14px] font-medium text-chrome uppercase"
        >
          {user.email.charAt(0)}
        </span>
      </Tooltip>
    </nav>
  );
}

interface Tab {
  to: NavItem["to"];
  label: string;
  icon: Icon;
  active: boolean;
  /** Tabs that share a page also switch what it shows. */
  onSelect?: () => void;
}

/**
 * A link that knows its own tab. A router `Link` marks every link to the current page as current, but the Map
 * and Add place tabs share a page and only one of them is.
 */
function TabLink({ to, label, icon: IconComponent, active, onSelect }: Tab) {
  const navigate = useNavigate();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    // Leave new-tab and other modified clicks to the browser.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    event.preventDefault();
    onSelect?.();
    void navigate({ to });
  }

  return (
    <a
      href={to}
      onClick={handleClick}
      aria-current={active ? "page" : undefined}
      className={`${TAB_ITEM} ${active ? "text-chrome" : ""}`}
    >
      <IconComponent size={22} weight={active ? "fill" : "regular"} aria-hidden />
      {label}
    </a>
  );
}

/** The phone navigation: a tab bar along the bottom (DESIGN.md: Layout, Mobile). */
function TabBar() {
  const logout = useLogoutWithToast();
  const { mode, setMode } = usePlacesMode();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const onMap = pathname === "/map";

  const tabs: Tab[] = [
    { to: "/map", label: "Map", icon: MapTrifoldIcon, active: onMap && mode === "browse", onSelect: () => setMode("browse") },
    { to: "/map", label: "Add place", icon: MapPinPlusIcon, active: onMap && mode === "add", onSelect: () => setMode("add") },
    { to: "/upload", label: "Import", icon: UploadSimpleIcon, active: pathname === "/upload" },
  ];

  return (
    <nav aria-label="Main" className="flex shrink-0 bg-ink pb-[env(safe-area-inset-bottom)] tablet:hidden">
      <div className="flex h-16 flex-1">
        {tabs.map((tab) => (
          <TabLink key={tab.label} {...tab} />
        ))}
        <button type="button" disabled={logout.pending} onClick={logout.run} className={TAB_ITEM}>
          <SignOutIcon size={22} aria-hidden />
          Log out
        </button>
      </div>
    </nav>
  );
}

interface AppShellProps {
  user: User;
  children: ReactNode;
}

/** The frame around signed-in pages: the rail on wider screens, the tab bar on phones. */
export function AppShell({ user, children }: AppShellProps) {
  return (
    <div className="flex h-dvh flex-col bg-chrome tablet:flex-row">
      <Rail user={user} />
      <main className="min-h-0 min-w-0 flex-1">{children}</main>
      <TabBar />
    </div>
  );
}
