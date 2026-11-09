import { ActivityRecorder } from "../../social/services/activity-recorder.service";
import type { MediaType } from "../../media/constants/media-type.constant";
import { MediaInteractions, type MediaInteractionStore } from "../media-interactions.repository";
import { ACTIVITY_TYPE_BY_FLAG, diffInteractionActivity } from "../helpers/interaction-activity.helper";
import type { InteractionStateInput } from "../helpers/interaction-state-rules.helper";
import type { InteractionRowFor, MediaInteractionAdapter } from "../types/media-interaction.types";

const STORES = {
  movie: MediaInteractions.forMovie(),
  tv: MediaInteractions.forSeries(),
} as const;

const storeFor = <TKind extends MediaType>(kind: TKind) =>
  STORES[kind] as unknown as MediaInteractionStore<InteractionRowFor<TKind>>;

// The Interaction module: a user's liked / watchlisted / watched / rating
// writes, once for Films and Series. Only what an adapter supplies differs.
export class MediaInteractionService {
  static async get<TKind extends MediaType, TMedia extends { id: number }, TChange extends InteractionStateInput, TState>(
    adapter: MediaInteractionAdapter<TKind, TMedia, TChange, TState>,
    userId: string,
    tmdbId: number,
  ): Promise<TState | null> {
    const media = await adapter.findOrCreateMedia(tmdbId);
    if (!media) return null;
    return adapter.toState(await storeFor(adapter.mediaType).find(userId, media.id));
  }

  // Only the fields sent change; the state rules fill in the implied ones.
  static async update<TKind extends MediaType, TMedia extends { id: number }, TChange extends InteractionStateInput, TState>(
    adapter: MediaInteractionAdapter<TKind, TMedia, TChange, TState>,
    userId: string,
    tmdbId: number,
    change: TChange,
  ): Promise<TState | null> {
    const media = await adapter.findOrCreateMedia(tmdbId);
    if (!media) return null;

    const store = storeFor(adapter.mediaType);
    const previous = await store.find(userId, media.id);
    await adapter.cascade?.(userId, media, change);

    const current = await store.upsertState(userId, media.id, {
      liked: change.liked,
      watchlisted: change.watchlisted,
      rating: change.rating,
      watched: change.watched,
    });

    const { record, retract } = diffInteractionActivity(change, previous, current);
    const activity = (flag: keyof typeof ACTIVITY_TYPE_BY_FLAG) => ({
      userId,
      subject: adapter.activitySubject(media),
      type: ACTIVITY_TYPE_BY_FLAG[flag],
      entityId: String(media.id),
    });
    for (const flag of record) ActivityRecorder.recordMedia(activity(flag));
    await Promise.all(retract.map((flag) => ActivityRecorder.retractMedia(activity(flag))));

    return adapter.toState(current);
  }

  // Row-only, for logs and reviews: no Activity, and a Series caller owns its
  // own cascade. Watching still clears the Watchlist.
  static async setWatched(
    mediaType: MediaType,
    userId: string,
    mediaId: number,
    watched: boolean,
  ): Promise<void> {
    await STORES[mediaType].upsertState(userId, mediaId, { watched });
  }
}
