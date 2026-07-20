import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  movies: (query?: string) => ["admin", "movies", query ?? ""] as const,
  serials: (query?: string) => ["admin", "serials", query ?? ""] as const,
};

export const useAdminMovies = (query?: string) =>
  useQuery({ queryKey: adminMediaKeys.movies(query), queryFn: () => listAdminMovies(query) });

export const useAdminSerials = (query?: string) =>
  useQuery({ queryKey: adminMediaKeys.serials(query), queryFn: () => listAdminSerials(query) });

const useMovieAction = <TInput>(mutationFn: (input: TInput) => Promise<void>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "movies"] });
    },
  });
};

const useSerialAction = <TInput>(mutationFn: (input: TInput) => Promise<void>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "serials"] });
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
