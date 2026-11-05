import { healthResponseSchema } from "@location-manager/shared";
import { Badge, Loader } from "@cloudflare/kumo";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

// Placeholder until the auth and map routes exist; verifies the client → proxy → server wiring.
export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const health = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const res = await fetch("/api/health");
      if (!res.ok) throw new Error(`Health check failed (${res.status})`);
      return healthResponseSchema.parse(await res.json());
    },
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3">
      <h1 className="text-2xl font-semibold">Location Manager</h1>
      {health.isPending && <Loader />}
      {health.isSuccess && <Badge variant="success">API healthy</Badge>}
      {health.isError && <Badge variant="error">{health.error.message}</Badge>}
    </main>
  );
}
