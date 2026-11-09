import type { ActivitySubject } from "../../social/services/activity-recorder.service";
import type { MediaType } from "../../media/constants/media-type.constant";
import type {
  InteractionStateInput,
  InteractionStateRow,
} from "../helpers/interaction-state-rules.helper";
import type { SeriesInteractionStateRow } from "../media-interactions.repository";

export type InteractionRowFor<TKind extends MediaType> = TKind extends "tv"
  ? SeriesInteractionStateRow
  : InteractionStateRow;

// The per-media seam of the Interaction module: everything a Film and a
// Series Interaction write genuinely differ in.
export type MediaInteractionAdapter<
  TKind extends MediaType,
  TMedia extends { id: number },
  TChange extends InteractionStateInput,
  TState,
> = {
  mediaType: TKind;
  findOrCreateMedia: (tmdbId: number) => Promise<TMedia | null>;
  activitySubject: (media: TMedia) => ActivitySubject;
  // Runs before the Interaction row is written. Series cascade a watched
  // toggle to every season and episode here.
  cascade?: (userId: string, media: TMedia, change: TChange) => Promise<void>;
  toState: (row: InteractionRowFor<TKind> | null) => TState;
};
