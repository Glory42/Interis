import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createMusicLog,
  deleteMusicLog,
  getMusicArchive,
  getMusicDetail,
  getMusicInteraction,
  getMyMusicLogs,
  searchMusic,
  updateMusicInteraction,
  updateMusicLog,
  type CreateMusicLogInput,
  type MusicArchiveSort,
  type MusicDetailReviewSort,
  type MusicInteraction,
  type MyMusicLog,
  type UpdateMusicInteractionInput,
  type UpdateMusicLogInput,
} from "@/features/music/api";

export const musicKeys = {
  all: ["music"] as const,
  search: (query: string) => ["music", "search", query] as const,
  detailView: (mbid: string, reviewsSort: MusicDetailReviewSort) =>
    ["music", "detail-view", mbid, reviewsSort] as const,
  interaction: (mbid: string) => ["music", "interaction", mbid] as const,
  myLogs: ["music", "my-logs"] as const,
  archive: (genre: string, type: string, sort: MusicArchiveSort, limit: number) =>
    ["music", "archive", genre, type, sort, limit] as const,
};

export const useMusicSearch = (query: string) =>
  useQuery({
    queryKey: musicKeys.search(query),
    queryFn: ({ signal }) => searchMusic(query, { signal }),
    enabled: query.trim().length >= 2,
  });

export const useMusicDetailView = (
  mbid: string,
  reviewsSort: MusicDetailReviewSort,
  enabled = true,
) =>
  useQuery({
    queryKey: musicKeys.detailView(mbid, reviewsSort),
    queryFn: ({ signal }) => getMusicDetail(mbid, { reviewsSort }, { signal }),
    enabled: enabled && mbid.length > 0,
  });

export const useMusicInteraction = (mbid: string, enabled = true) =>
  useQuery({
    queryKey: musicKeys.interaction(mbid),
    queryFn: () => getMusicInteraction(mbid),
    enabled: enabled && mbid.length > 0,
  });

export const useUpdateMusicInteraction = (mbid: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateMusicInteractionInput) =>
      updateMusicInteraction(mbid, input),
    onMutate: async (input) => {
      const queryKey = musicKeys.interaction(mbid);
      await queryClient.cancelQueries({ queryKey });
      const previousState = queryClient.getQueryData<MusicInteraction>(queryKey);
      if (previousState) {
        queryClient.setQueryData<MusicInteraction>(queryKey, {
          ...previousState,
          ...(input.liked !== undefined ? { liked: input.liked } : {}),
          ...(input.wantToListen !== undefined ? { wantToListen: input.wantToListen } : {}),
          ...(input.rating !== undefined ? { rating: input.rating } : {}),
        });
      }
      return { previousState };
    },
    onError: (_error, _input, context) => {
      if (!context?.previousState) return;
      queryClient.setQueryData(musicKeys.interaction(mbid), context.previousState);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: musicKeys.interaction(mbid) });
    },
  });
};

export const useCreateMusicLog = (mbid: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateMusicLogInput) => createMusicLog(mbid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: musicKeys.myLogs });
      queryClient.invalidateQueries({ queryKey: musicKeys.all });
    },
  });
};

export const useMyMusicLogs = () =>
  useQuery({
    queryKey: musicKeys.myLogs,
    queryFn: getMyMusicLogs,
  });

export const useUpdateMusicLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ entryId, input }: { entryId: string; input: UpdateMusicLogInput }) =>
      updateMusicLog(entryId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: musicKeys.myLogs });
    },
  });
};

export const useDeleteMusicLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entryId: string) => deleteMusicLog(entryId),
    onSuccess: (_data, entryId) => {
      queryClient.invalidateQueries({ queryKey: musicKeys.myLogs });
      queryClient.setQueryData<MyMusicLog[]>(musicKeys.myLogs, (prev) =>
        prev ? prev.filter((e) => e.id !== entryId) : prev,
      );
    },
  });
};

export const useMusicArchive = (
  genre: string,
  type: string,
  sort: MusicArchiveSort,
  limit: number,
) =>
  useInfiniteQuery({
    queryKey: musicKeys.archive(genre, type, sort, limit),
    initialPageParam: 1,
    queryFn: ({ signal, pageParam }) => {
      const page = typeof pageParam === "number" ? pageParam : 1;
      return getMusicArchive({ genre, type, sort, page, limit }, { signal });
    },
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
  });
