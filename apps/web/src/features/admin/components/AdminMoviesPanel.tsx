import { useDeferredValue, useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminPanelHeader } from "@/features/admin/components/AdminPanelHeader";
import { AdminPanelState } from "@/features/admin/components/AdminPanelState";
import { AdminSearchInput } from "@/features/admin/components/AdminSearchInput";
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
      <AdminPanelHeader
        title="Movies"
        description="Manage locally cached movie records."
        action={
          <AdminSearchInput
            value={queryInput}
            onChange={(event) => setQueryInput(event.target.value)}
            placeholder="Search by title..."
          />
        }
      />

      <AdminPanelState
        query={moviesQuery}
        emptyMessage="No cached movies found."
        errorMessage="Could not load movies."
      >
        {(movies) => (
          <Card>
            <Table>
              <TableHeader>
                <TableRow className="border-0 hover:bg-transparent">
                  <TableHead>Title</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Director</TableHead>
                  <TableHead>TMDB ID</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movies.map((movie) => (
                  <TableRow key={movie.id}>
                    <TableCell className="text-foreground">{movie.title}</TableCell>
                    <TableCell className="text-muted-foreground">{movie.releaseYear ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{movie.director ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{movie.tmdbId}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <EditMovieAction movie={movie} />
                        <RefreshMovieAction movie={movie} />
                        <DeleteMovieAction movie={movie} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </AdminPanelState>
    </div>
  );
};
