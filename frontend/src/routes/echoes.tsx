import { createFileRoute } from "@tanstack/react-router";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/echoes")({
  component: EchoesPage,
});

function EchoesPage() {
  return (
    <PageWrapper
      title="Echoes"
      subtitle="Community conversation features are currently under construction."
    >
      <Card>
        <CardHeader>
          <CardTitle>Under construction</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Echoes will bring richer discussion spaces, highlights, and collaborative discovery.
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
