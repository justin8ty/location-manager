import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppLayout } from "../components/app-layout";
import { currentUserQuery } from "../features/auth/session";

/** Protected pages: visitors without a session are sent to login, then brought back. */
export const Route = createFileRoute("/_auth")({
  beforeLoad: async ({ context, location }) => {
    const user = await context.queryClient.ensureQueryData(currentUserQuery);

    if (!user) throw redirect({ to: "/login", search: { redirect: location.href } });

    return { user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user } = Route.useRouteContext();

  return (
    <AppLayout user={user}>
      <Outlet />
    </AppLayout>
  );
}
