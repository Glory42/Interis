import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { FilmCard } from "@/features/films/components/FilmCard";
import { FilmSearch } from "@/features/films/components/FilmSearch";
import { useMovieSearch, useRecentMovies } from "@/features/films/hooks/useMovies";

export const Route = createFileRoute("/films/")({
  component: FilmsPage,
});

function FilmsPage() {
  const navigate = Route.useNavigate();

  const [queryInput, setQueryInput] = useState("");
  const [debouncedInput, setDebouncedInput] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedInput(queryInput);
    }, 220);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [queryInput]);

  const suggestionsQuery = useMovieSearch(debouncedInput);
  const recentMoviesQuery = useRecentMovies();

  const suggestions = useMemo(
    () => (suggestionsQuery.data ?? []).slice(0, 8),
    [suggestionsQuery.data],
  );

  return (
    <PageWrapper
      title="Films"
      subtitle="Find movies instantly and browse what is currently in cinemas."
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-5">
        <section className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recently in cinema</CardTitle>
            </CardHeader>

            <CardContent>
              {recentMoviesQuery.isPending ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Spinner /> Loading latest releases...
                </p>
              ) : null}

              {recentMoviesQuery.isError ? (
                <p className="text-sm text-destructive">
                  Could not load recent movies from TMDB.
                </p>
              ) : null}

              {!recentMoviesQuery.isPending && !recentMoviesQuery.isError ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:gap-4">
                  {recentMoviesQuery.data?.map((movie, index) => (
                    <div
                      key={`recent-${movie.id}`}
                      className="animate-fade-up"
                      style={{ animationDelay: `${Math.min(index * 35, 240)}ms` }}
                    >
                      <FilmCard movie={movie} />
                    </div>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </section>

        <aside className="xl:sticky xl:top-6 xl:h-fit">
          <FilmSearch
            query={queryInput}
            onQueryChange={setQueryInput}
            suggestions={suggestions}
            isSuggestionsLoading={suggestionsQuery.isFetching}
            onSelectSuggestion={(movie) => {
              void navigate({
                to: "/films/$tmdbId",
                params: { tmdbId: String(movie.id) },
                startTransition: true,
                viewTransition: true,
              });
            }}
          />
        </aside>
      </div>
    </PageWrapper>
  );
}
