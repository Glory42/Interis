import { createFileRoute } from "@tanstack/react-router";
import { CinemaArchivePage } from "@/features/films/components/CinemaArchivePage";

export const Route = createFileRoute("/cinema/")({
  component: CinemaPage,
});

function CinemaPage() {
  return <CinemaArchivePage />;
}
