import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { MapFrame } from "../components/map-frame";
import { MarkTile } from "../components/mark";
import { currentUserQuery } from "../features/auth/session";

// Loaded after the form has rendered: the map (and maplibre-gl behind it) is decoration here.
const DecorativeMap = lazy(() => import("../features/auth/decorative-map"));

/** Login and register: only for visitors without a session. */
export const Route = createFileRoute("/_guest")({
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData(currentUserQuery);

    if (user) throw redirect({ to: "/map" });
  },
  component: GuestLayout,
});

/** The column holds the product name and the form; the map frame beside it (above it on phones) is decoration. */
function GuestLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-chrome tablet:h-dvh tablet:flex-row">
      <main className="flex flex-1 flex-col tablet:w-(--column-width) tablet:flex-none">
        <header className="flex h-[68px] shrink-0 items-center gap-3 px-5">
          <MarkTile />
          <span className="font-semibold text-ink">JustNaik Places Manager</span>
        </header>
        <div className="flex flex-1 items-center px-5 pt-4 pb-10">
          <div className="mx-auto w-full max-w-[360px]">
            <Outlet />
          </div>
        </div>
      </main>
      <div className="order-first flex h-[35dvh] shrink-0 flex-col p-2 tablet:order-none tablet:h-auto tablet:flex-1 tablet:py-(--pane-gap) tablet:pr-(--pane-gap) tablet:pl-1">
        <MapFrame>
          <Suspense fallback={null}>
            <DecorativeMap />
          </Suspense>
        </MapFrame>
      </div>
    </div>
  );
}
