import { Text } from "@cloudflare/kumo";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/upload")({
  component: UploadPage,
});

// Placeholder until the upload feature lands (step 8).
function UploadPage() {
  return (
    <div className="p-6">
      <Text variant="heading2" as="h1">
        Upload
      </Text>
    </div>
  );
}
