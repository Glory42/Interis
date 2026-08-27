import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTrackLog,
  deleteTrackLog,
  getMyTrackLogs,
  getTrackDetail,
  getTrackInteraction,
  updateTrackInteraction,
  updateTrackLog,
  type CreateTrackLogInput,
  type MyTrackLog,
  type TrackDetailReviewSort,
  type TrackInteraction,
  type UpdateTrackInteractionInput,
  type UpdateTrackLogInput,
} from "@/features/music/track-api";

export const trackKeys = {
  all: ["music", "tracks"] as const,
  detailView: (mbid: string, reviewsSort: TrackDetailReviewSort) =>
    ["music", "tracks", "detail-view", mbid, reviewsSort] as const,
  interaction: (mbid: string) => ["music", "tracks", "interaction", mbid] as const,
  myLogs: ["music", "tracks", "my-logs"] as const,
};

export const useTrackDetailView = (
  mbid: string,
  reviewsSort: TrackDetailReviewSort,
  enabled = true,
) =>
  useQuery({
    queryKey: trackKeys.detailView(mbid, reviewsSort),
    queryFn: ({ signal }) => getTrackDetail(mbid, { reviewsSort }, { signal }),
    enabled: enabled && mbid.length > 0,
  });

export const useTrackInteraction = (mbid: string, enabled = true) =>
  useQuery({
    queryKey: trackKeys.interaction(mbid),
    queryFn: () => getTrackInteraction(mbid),
    enabled: enabled && mbid.length > 0,
  });

export const useUpdateTrackInteraction = (mbid: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateTrackInteractionInput) => updateTrackInteraction(mbid, input),
    onMutate: async (input) => {
      const queryKey = trackKeys.interaction(mbid);
      await queryClient.cancelQueries({ queryKey });
      const previousState = queryClient.getQueryData<TrackInteraction>(queryKey);
      if (previousState) {
        queryClient.setQueryData<TrackInteraction>(queryKey, {
          ...previousState,
          ...(input.liked !== undefined ? { liked: input.liked } : {}),
          ...(input.rating !== undefined ? { rating: input.rating } : {}),
        });
      }
      return { previousState };
    },
    onError: (_error, _input, context) => {
      if (!context?.previousState) return;
      queryClient.setQueryData(trackKeys.interaction(mbid), context.previousState);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: trackKeys.interaction(mbid) });
    },
  });
};

export const useCreateTrackLog = (mbid: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTrackLogInput) => createTrackLog(mbid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trackKeys.myLogs });
      queryClient.invalidateQueries({
        queryKey: ["music", "tracks", "detail-view", mbid],
      });
    },
  });
};

export const useMyTrackLogs = () =>
  useQuery({
    queryKey: trackKeys.myLogs,
    queryFn: getMyTrackLogs,
  });

export const useUpdateTrackLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ entryId, input }: { entryId: string; input: UpdateTrackLogInput }) =>
      updateTrackLog(entryId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trackKeys.myLogs });
    },
  });
};

export const useDeleteTrackLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entryId: string) => deleteTrackLog(entryId),
    onSuccess: (_data, entryId) => {
      queryClient.invalidateQueries({ queryKey: trackKeys.myLogs });
      queryClient.setQueryData<MyTrackLog[]>(trackKeys.myLogs, (prev) =>
        prev ? prev.filter((e) => e.id !== entryId) : prev,
      );
    },
  });
};
