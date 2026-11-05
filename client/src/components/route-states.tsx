import { Button, Empty, Link, Loader } from "@cloudflare/kumo";
import { CompassIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { type ErrorComponentProps, useRouter } from "@tanstack/react-router";

// Route-level states fill the viewport; page-level states fill the content area beside the sidebar.
const FULL_SCREEN = "min-h-dvh";
const CONTENT_AREA = "h-full";

function PendingState({ className }: { className: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`} role="status" aria-label="Loading">
      <Loader size={24} />
    </div>
  );
}

interface ErrorStateProps {
  title: string;
  message: string;
  onRetry: () => void;
  className: string;
}

function ErrorState({ title, message, onRetry, className }: ErrorStateProps) {
  return (
    <div className={`mx-auto flex max-w-md items-center justify-center p-6 ${className}`}>
      <Empty
        icon={<WarningCircleIcon size={32} className="text-kumo-danger" />}
        title={title}
        description={message}
        contents={
          <Button variant="primary" onClick={onRetry}>
            Try again
          </Button>
        }
      />
    </div>
  );
}

export function RoutePending() {
  return <PendingState className={FULL_SCREEN} />;
}

export function PagePending() {
  return <PendingState className={CONTENT_AREA} />;
}

/** Shown when a route fails to load, e.g. the server is unreachable while checking the session. */
export function RouteError({ error, reset }: ErrorComponentProps) {
  const router = useRouter();

  async function retry() {
    reset();
    await router.invalidate();
  }

  const message = error instanceof Error ? error.message : "Please try again.";

  return <ErrorState title="Something went wrong" message={message} onRetry={retry} className={FULL_SCREEN} />;
}

interface PageErrorProps {
  title: string;
  error: Error;
  onRetry: () => void;
}

/** Shown in the content area when a signed-in page fails to load its data. */
export function PageError({ title, error, onRetry }: PageErrorProps) {
  return <ErrorState title={title} message={error.message} onRetry={onRetry} className={CONTENT_AREA} />;
}

export function RouteNotFound() {
  return (
    <div className={`mx-auto flex max-w-md items-center justify-center p-6 ${FULL_SCREEN}`}>
      <Empty
        icon={<CompassIcon size={32} />}
        title="Page not found"
        description="This page doesn't exist."
        contents={<Link href="/map">Go to the map</Link>}
      />
    </div>
  );
}
