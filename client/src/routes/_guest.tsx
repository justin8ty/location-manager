import { MapPinIcon } from "@phosphor-icons/react";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { currentUserQuery } from "../features/auth/session";

/** Login and register: only for visitors without a session. */
export const Route = createFileRoute("/_guest")({
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData(currentUserQuery);

    if (user) throw redirect({ to: "/map" });
  },
  component: GuestLayout,
});

function GuestLayout() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-kumo-canvas p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2 text-kumo-default">
          <MapPinIcon size={24} weight="duotone" className="text-kumo-brand" />
          <span className="text-lg font-semibold">Location Manager</span>
        </div>
        <div className="rounded-xl bg-kumo-base p-6 shadow-sm ring ring-kumo-line sm:p-8">
          <Outlet />
        </div>
      </div>
    </main>
  );
}
