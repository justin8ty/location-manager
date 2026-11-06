import { Loader } from "@cloudflare/kumo";
import { type ErrorComponentProps, Link, useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Button, buttonClassName } from "./button";
import { MarkTile } from "./mark";

function FullScreenMessage({ title, message, action }: { title: string; message: string; action: ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-chrome p-6">
      <div className="flex max-w-sm flex-col items-start gap-4">
        <MarkTile />
        <div>
          <h1 className="text-title text-ink">{title}</h1>
          <p className="mt-1 text-ink-2">{message}</p>
        </div>
        {action}
      </div>
    </main>
  );
}

export function RoutePending() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-chrome text-ink-2">
      <Loader size={24} aria-label="Loading" />
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

  const message = error instanceof Error ? error.message : "Please try again.";

  return (
    <FullScreenMessage
      title="Something went wrong"
      message={message}
      action={
        <Button variant="primary" onClick={() => void retry()}>
          Try again
        </Button>
      }
    />
  );
}

export function RouteNotFound() {
  return (
    <FullScreenMessage
      title="Page not found"
      message="This page doesn't exist."
      action={
        <Link to="/map" className={buttonClassName({ variant: "secondary" })}>
          Go to the map
        </Link>
      }
    />
  );
}
