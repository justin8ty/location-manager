import { Loader, Sidebar, useKumoToastManager, useSidebar } from "@cloudflare/kumo";
import type { User } from "@location-manager/shared";
import { type Icon, MapPinIcon, MapTrifoldIcon, SignOutIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { useMatchRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useLogout } from "../features/auth/session";

interface NavItem {
  to: "/map" | "/upload";
  label: string;
  icon: Icon;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/map", label: "Map", icon: MapTrifoldIcon },
  { to: "/upload", label: "Upload", icon: UploadSimpleIcon },
];

function Brand() {
  return (
    <div className="flex min-w-0 items-center gap-2 font-semibold text-kumo-default">
      <MapPinIcon size={20} weight="duotone" className="shrink-0 text-kumo-brand" />
      <span className="truncate">Location Manager</span>
    </div>
  );
}

function NavMenu() {
  const matchRoute = useMatchRoute();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar.Menu>
      {NAV_ITEMS.map((item) => (
        <Sidebar.MenuButton
          key={item.to}
          href={item.to}
          icon={item.icon}
          tooltip={item.label}
          active={Boolean(matchRoute({ to: item.to }))}
          onClick={() => setOpenMobile(false)}
        >
          {item.label}
        </Sidebar.MenuButton>
      ))}
    </Sidebar.Menu>
  );
}

function LogoutButton() {
  const logout = useLogout();
  const toasts = useKumoToastManager();

  function handleLogout() {
    logout.mutate(undefined, {
      onError: (error) => toasts.add({ variant: "error", title: "Couldn't log out", description: error.message }),
    });
  }

  return (
    <Sidebar.Menu>
      <Sidebar.MenuButton
        icon={logout.isPending ? <Loader size={16} /> : SignOutIcon}
        tooltip="Log out"
        disabled={logout.isPending}
        onClick={handleLogout}
      >
        Log out
      </Sidebar.MenuButton>
    </Sidebar.Menu>
  );
}

interface AppLayoutProps {
  user: User;
  children: ReactNode;
}

/** Shell for signed-in pages: sidebar navigation (a sheet on mobile) beside the page content. */
export function AppLayout({ user, children }: AppLayoutProps) {
  return (
    <Sidebar.Provider className="h-dvh">
      <Sidebar>
        <Sidebar.Header>
          <Brand />
        </Sidebar.Header>
        <Sidebar.Content>
          <Sidebar.Group>
            <NavMenu />
          </Sidebar.Group>
          <Sidebar.Group>
            <Sidebar.GroupLabel title={user.email}>
              <span className="truncate">{user.email}</span>
            </Sidebar.GroupLabel>
            <LogoutButton />
          </Sidebar.Group>
        </Sidebar.Content>
        <Sidebar.Footer>
          <Sidebar.Trigger />
        </Sidebar.Footer>
      </Sidebar>

      <div className="flex h-full min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-kumo-line px-3 md:hidden">
          <Sidebar.Trigger />
          <Brand />
        </header>
        <main className="min-h-0 flex-1 overflow-auto">{children}</main>
      </div>
    </Sidebar.Provider>
  );
}
