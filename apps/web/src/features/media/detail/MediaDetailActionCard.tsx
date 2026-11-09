import { MediaActionCard } from "@/features/media/detail/MediaActionCard";
import { MediaLogButton } from "@/features/media/detail/MediaLogButton";
import { UnwatchMediaDialog } from "@/features/media/detail/UnwatchMediaDialog";
import type { MediaDetailState } from "@/features/media/detail/use-media-detail";
import type { LogMediaTitle } from "@/features/media/log-editor/log-subject";
import type { MediaModuleStyles } from "@/features/media/styles";

type MediaDetailActionCardProps = {
  media: LogMediaTitle;
  // The viewer's latest Diary Entry of the title, from the detail view.
  userRating: { diaryEntryId: string | null; watchedDate: string | null } | null | undefined;
  moduleStyles: MediaModuleStyles;
  state: MediaDetailState;
};

// Log, the quick toggles and Your Rating for a Film or Series, plus the unwatch confirmation.
export const MediaDetailActionCard = ({ media, userRating, moduleStyles, state }: MediaDetailActionCardProps) => (
  <>
    <MediaActionCard
      moduleStyles={moduleStyles}
      logSlot={<MediaLogButton media={media} rating={state.yourRating} hasLogged={Boolean(userRating?.diaryEntryId)} />}
      tmdbId={media.tmdbId}
      itemType={media.kind === "film" ? "movie" : "serial"}
      viewerUsername={state.viewerUsername}
      lastWatchedDate={userRating?.watchedDate ?? null}
      currentRating={state.yourRating}
      onRatingChange={state.setRating}
      isRatingSaving={state.isSaving}
      isAuthenticated={state.isAuthenticated}
      isInteractionBusy={state.isBusy}
      isInteractionLoading={state.isLoading}
      actions={state.actions}
    />
    {state.unwatchConfirmation ? <UnwatchMediaDialog kind={media.kind} {...state.unwatchConfirmation} /> : null}
  </>
);
