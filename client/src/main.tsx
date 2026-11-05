import { LinkProvider, Toasty } from "@cloudflare/kumo";
import { QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "leaflet/dist/leaflet.css";
import "./index.css";
import { RouteError, RoutePending } from "./components/route-states";
import { RouterLink } from "./components/router-link";
import { clearSession } from "./features/auth/session";
import { createQueryClient } from "./lib/query-client";
import { routeTree } from "./routeTree.gen";

// Any request that finds the session gone: forget the user, then re-run the route
// guards, which send the visitor to /login?redirect=<current page>.
const queryClient = createQueryClient(() => {
  clearSession(queryClient);
  void router.invalidate();
});

const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: "intent",
  defaultPendingComponent: RoutePending,
  defaultErrorComponent: RouteError,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("root");

if (!rootElement) throw new Error("Root element #root not found");

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <LinkProvider component={RouterLink}>
        <Toasty>
          <RouterProvider router={router} />
        </Toasty>
      </LinkProvider>
    </QueryClientProvider>
  </StrictMode>,
);
