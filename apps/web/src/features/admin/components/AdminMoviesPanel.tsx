import { useDeferredValue, useState } from "react";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  DeleteMovieAction,
  EditMovieAction,
  RefreshMovieAction,
} from "@/features/admin/components/AdminMovieRowActions";
import { useAdminMovies } from "@/features/admin/hooks/useAdminMedia";

export const AdminMoviesPanel = () => {
  const [queryInput, setQueryInput] = useState("");
  const deferredQuery = useDeferredValue(queryInput.trim());
  const moviesQuery = useAdminMovies(deferredQuery.length > 0 ? deferredQuery : undefined);

  return (
    <div className="space-y-4">
      <Input
        value={queryInput}
        onChange={(event) => setQueryInput(event.target.value)}
        placeholder="Search by title..."
        className="max-w-sm"
      />

      {moviesQuery.isPending ? (
        <div className="flex items-center justify-center py-10">
          <Spinner />
        </div>
      ) : moviesQuery.isError ? (
        <p className="text-sm text-muted-foreground">Could not load movies.</p>
      ) : moviesQuery.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No cached movies found.</p>
      ) : (
        <div className="border border-border/60">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Year</th>
                <th className="px-3 py-2">Director</th>
                <th className="px-3 py-2">TMDB ID</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {moviesQuery.data.map((movie) => (
                <tr key={movie.id} className="border-b border-border/40 last:border-0">
                  <td className="px-3 py-2 text-foreground">{movie.title}</td>
                  <td className="px-3 py-2 text-muted-foreground">{movie.releaseYear ?? "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{movie.director ?? "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{movie.tmdbId}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      <EditMovieAction movie={movie} />
                      <RefreshMovieAction movie={movie} />
                      <DeleteMovieAction movie={movie} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
