import { Button, Empty, Link, Loader } from "@cloudflare/kumo";
import { CompassIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { type ErrorComponentProps, useRouter } from "@tanstack/react-router";

export function RoutePending() {
  return (
    <div className="flex min-h-dvh items-center justify-center" role="status" aria-label="Loading">
      <Loader size={24} />
    </div>
  );
}

/** Shown when a route fails to load, e.g. the server is unreachable while checking the session. */
export function RouteError({ error, reset }: ErrorComponentProps) {
  const router = useRouter();

  async function retry() {
    reset();
    await router.invalidate();
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md items-center justify-center p-6">
      <Empty
        icon={<WarningCircleIcon size={32} className="text-kumo-danger" />}
        title="Something went wrong"
        description={error instanceof Error ? error.message : "Please try again."}
        contents={
          <Button variant="primary" onClick={retry}>
            Try again
          </Button>
        }
      />
    </div>
  );
}

export function RouteNotFound() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md items-center justify-center p-6">
      <Empty
        icon={<CompassIcon size={32} />}
        title="Page not found"
        description="This page doesn't exist."
        contents={<Link href="/map">Go to the map</Link>}
      />
    </div>
  );
}
