import { Text } from "@cloudflare/kumo";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/map")({
  component: MapPage,
});

// Placeholder until the map feature lands (step 8).
function MapPage() {
  return (
    <div className="p-6">
      <Text variant="heading2" as="h1">
        Map
      </Text>
    </div>
  );
}
