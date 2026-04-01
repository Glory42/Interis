import { createFileRoute } from "@tanstack/react-router";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/codex")({
  component: CodexPage,
});

function CodexPage() {
  return (
    <PageWrapper
      title="Codex"
      subtitle="Long-form notes and media knowledge tools are in progress."
    >
      <Card>
        <CardHeader>
          <CardTitle>Under construction</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Codex will expand into deeper annotations, reference collections, and connected media records.
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
