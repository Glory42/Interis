import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { LogFilmModal } from "@/features/diary/components/LogFilmModal";
import { FilmDetail } from "@/features/films/components/FilmDetail";
import { MovieLogs } from "@/features/films/components/MovieLogs";
import { useMovieDetail } from "@/features/films/hooks/useMovies";

export const Route = createFileRoute("/films/$tmdbId")({
  component: FilmDetailPage,
});

function FilmDetailPage() {
  const { tmdbId: tmdbIdParam } = Route.useParams();
  const tmdbId = Number(tmdbIdParam);
  const isValidTmdbId = Number.isInteger(tmdbId) && tmdbId > 0;

  const movieQuery = useMovieDetail(tmdbId, isValidTmdbId);

  if (!isValidTmdbId) {
    return (
      <PageWrapper title="Invalid movie">
        <Card>
          <CardContent className="space-y-3 p-5 text-sm text-muted-foreground">
            <p>The movie identifier is not valid.</p>
            <Button asChild variant="outline">
              <Link to="/films">Back to search</Link>
            </Button>
          </CardContent>
        </Card>
      </PageWrapper>
    );
  }

  if (movieQuery.isPending) {
    return (
      <PageWrapper>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner /> Loading movie details...
        </div>
      </PageWrapper>
    );
  }

  if (movieQuery.isError || !movieQuery.data) {
    return (
      <PageWrapper title="Movie not found">
        <Card>
          <CardContent className="space-y-3 p-5 text-sm text-muted-foreground">
            <p>This movie is not available right now.</p>
            <Button asChild variant="outline">
              <Link to="/films">Back to search</Link>
            </Button>
          </CardContent>
        </Card>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div>
          <Button asChild variant="outline" size="sm">
            <Link to="/films" viewTransition startTransition>
              <ArrowLeft className="h-4 w-4" /> Back to films
            </Link>
          </Button>
        </div>

        <FilmDetail
          movie={movieQuery.data}
          actionSlot={
            <LogFilmModal
              tmdbId={movieQuery.data.tmdbId}
              movieTitle={movieQuery.data.title}
            />
          }
        />

        <MovieLogs tmdbId={movieQuery.data.tmdbId} />
      </div>
    </PageWrapper>
  );
}
