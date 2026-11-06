import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminPagedList } from "@/features/admin/hooks/useAdminPagedList";
import {
  deleteAdminMovie,
  deleteAdminSerial,
  listAdminMovies,
  listAdminSerials,
  refreshAdminMovie,
  refreshAdminSerial,
  updateAdminMovie,
  updateAdminSerial,
  type AdminUpdateMovieInput,
  type AdminUpdateSerialInput,
} from "@/features/admin/media-api";

export const adminMediaKeys = {
  moviesAll: ["admin", "movies"] as const,
  movies: (query?: string) => ["admin", "movies", query ?? ""] as const,
  serialsAll: ["admin", "serials"] as const,
  serials: (query?: string) => ["admin", "serials", query ?? ""] as const,
};

export const useAdminMovies = (query?: string) =>
  useAdminPagedList(adminMediaKeys.movies(query), (page) => listAdminMovies(query, page));

export const useAdminSerials = (query?: string) =>
  useAdminPagedList(adminMediaKeys.serials(query), (page) => listAdminSerials(query, page));

const useMovieAction = <TInput>(mutationFn: (input: TInput) => Promise<void>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminMediaKeys.moviesAll });
    },
  });
};

const useSerialAction = <TInput>(mutationFn: (input: TInput) => Promise<void>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminMediaKeys.serialsAll });
    },
  });
};

export const useUpdateAdminMovie = () =>
  useMovieAction(({ id, fields }: { id: number; fields: AdminUpdateMovieInput }) =>
    updateAdminMovie(id, fields),
  );
export const useRefreshAdminMovie = () => useMovieAction(refreshAdminMovie);
export const useDeleteAdminMovie = () => useMovieAction(deleteAdminMovie);

export const useUpdateAdminSerial = () =>
  useSerialAction(({ id, fields }: { id: number; fields: AdminUpdateSerialInput }) =>
    updateAdminSerial(id, fields),
  );
export const useRefreshAdminSerial = () => useSerialAction(refreshAdminSerial);
export const useDeleteAdminSerial = () => useSerialAction(deleteAdminSerial);
