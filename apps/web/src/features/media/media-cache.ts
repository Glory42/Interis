import type { QueryClient } from "@tanstack/react-query";
import { authKeys } from "@/features/auth/hooks/useAuth";
import { invalidateFollowingFeed } from "@/features/feed/hooks/feed-cache";
import { restoreQueries } from "@/lib/query-optimistic";
import type { MeProfile } from "@/types/api";
import type { MediaEvent } from "./cache/media-events";
import { optimisticTargets, patchOptimistically } from "./cache/optimistic-patches";
import { mediaRefreshKeys } from "./cache/refresh-keys";

export type {
  InteractionInput,
  MediaEvent,
  MediaKind,
  MediaTitle,
  SeasonInteractionInput,
} from "./cache/media-events";
export { reviewEditedEvent, toMediaKind } from "./cache/media-events";
export type { InteractionState } from "./cache/interaction-rules";

// Patches the cache to what the server will save for this event; call the returned rollback if it fails.
export const applyMediaEvent = async (queryClient: QueryClient, event: MediaEvent): Promise<() => void> => {
  await Promise.all(optimisticTargets(event).map((queryKey) => queryClient.cancelQueries({ queryKey })));
  const taken = patchOptimistically(queryClient, event);
  return () => {
    for (const snapshot of [...taken].reverse()) restoreQueries(queryClient, snapshot);
  };
};

const viewerUsername = (queryClient: QueryClient): string | null =>
  queryClient.getQueryData<MeProfile | null>(authKeys.me)?.username ?? null;

// Refetches only this title's and this viewer's queries, never a whole namespace.
// Every event also lands in (or changes) the Following Feed.
export const refreshAfter = async (
  queryClient: QueryClient,
  event: MediaEvent,
  viewer: string | null = viewerUsername(queryClient),
): Promise<void> => {
  await Promise.all([
    ...mediaRefreshKeys(event, viewer).map((queryKey) => queryClient.invalidateQueries({ queryKey })),
    invalidateFollowingFeed(queryClient),
  ]);
};
