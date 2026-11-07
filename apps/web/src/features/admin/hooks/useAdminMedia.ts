import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminPagedList } from "@/features/admin/hooks/useAdminPagedList";
import {
  deleteAdminFilm,
  deleteAdminSeries,
  listAdminFilms,
  listAdminTv,
  refreshAdminFilm,
  refreshAdminSeries,
  updateAdminFilm,
  updateAdminSeries,
  type AdminUpdateFilmInput,
  type AdminUpdateSeriesInput,
} from "@/features/admin/media-api";

export const adminMediaKeys = {
  moviesAll: ["admin", "movies"] as const,
  movies: (query?: string) => ["admin", "movies", query ?? ""] as const,
  serialsAll: ["admin", "serials"] as const,
  serials: (query?: string) => ["admin", "serials", query ?? ""] as const,
};

export const useAdminFilms = (query?: string) =>
  useAdminPagedList(adminMediaKeys.movies(query), (page) => listAdminFilms(query, page));

export const useAdminTv = (query?: string) =>
  useAdminPagedList(adminMediaKeys.serials(query), (page) => listAdminTv(query, page));

const useFilmAction = <TInput>(mutationFn: (input: TInput) => Promise<void>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminMediaKeys.moviesAll });
    },
  });
};

const useSeriesAction = <TInput>(mutationFn: (input: TInput) => Promise<void>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminMediaKeys.serialsAll });
    },
  });
};

export const useUpdateAdminFilm = () =>
  useFilmAction(({ id, fields }: { id: number; fields: AdminUpdateFilmInput }) =>
    updateAdminFilm(id, fields),
  );
export const useRefreshAdminFilm = () => useFilmAction(refreshAdminFilm);
export const useDeleteAdminFilm = () => useFilmAction(deleteAdminFilm);

export const useUpdateAdminSeries = () =>
  useSeriesAction(({ id, fields }: { id: number; fields: AdminUpdateSeriesInput }) =>
    updateAdminSeries(id, fields),
  );
export const useRefreshAdminSeries = () => useSeriesAction(refreshAdminSeries);
export const useDeleteAdminSeries = () => useSeriesAction(deleteAdminSeries);
