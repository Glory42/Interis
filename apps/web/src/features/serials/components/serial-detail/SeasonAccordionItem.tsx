import { useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronUp, Heart, MessageSquare } from "lucide-react";
import type { SerialDetailResponse } from "@/features/serials/api";
import { getStillUrl, getPosterUrl } from "@/features/serials/components/utils";
import {
  useSeriesSeasonDetail,
  useUpdateSeasonInteraction,
  useUpdateEpisodeInteraction,
  useSeasonReview,
  useUpsertSeasonReview,
  useDeleteSeasonReview,
  useEpisodeReview,
  useUpsertEpisodeReview,
  useDeleteEpisodeReview,
} from "@/features/serials/hooks/useSerials";
import { SERIAL_MODULE_STYLES } from "@/features/serials/components/serial-detail/styles";
import {
  toDateLabel,
  toEpisodeCodeLabel,
  toYearFromDateLabel,
} from "@/features/serials/components/serial-detail/utils";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { LogMediaDialog } from "@/features/diary/components/log-media/LogMediaDialog";

type SeasonAccordionItemProps = {
  tmdbId: number;
  season: SerialDetailResponse["series"]["seasons"][number];
  isOpen: boolean;
  onToggle: () => void;
};

export const SeasonAccordionItem = ({
  tmdbId,
  season,
  isOpen,
  onToggle,
}: SeasonAccordionItemProps) => {
  const { user } = useAuth();
  const seasonDetailQuery = useSeriesSeasonDetail(
    tmdbId,
    season.seasonNumber,
    isOpen,
  );

  const episodes = seasonDetailQuery.data?.episodes ?? [];

  const [activeReviewModal, setActiveReviewModal] = useState<{
    type: "season";
  } | {
    type: "episode";
    episodeNumber: number;
    episodeName: string;
  } | null>(null);

  const [seasonReviewContent, setSeasonReviewContent] = useState("");
  const [seasonReviewContainsSpoilers, setSeasonReviewContainsSpoilers] = useState(false);
  const [seasonFormError, setSeasonFormError] = useState<string | null>(null);
  const [episodeReviewContent, setEpisodeReviewContent] = useState("");
  const [episodeReviewContainsSpoilers, setEpisodeReviewContainsSpoilers] = useState(false);
  const [episodeFormError, setEpisodeFormError] = useState<string | null>(null);

  const seasonReviewQuery = useSeasonReview(
    tmdbId,
    season.seasonNumber,
    activeReviewModal?.type === "season",
  );

  const activeEpisodeNumber = activeReviewModal?.type === "episode" ? activeReviewModal.episodeNumber : null;
  const episodeReviewQuery = useEpisodeReview(
    tmdbId,
    season.seasonNumber,
    activeEpisodeNumber ?? 0,
    activeEpisodeNumber !== null,
  );

  const updateSeasonInteractionMutation = useUpdateSeasonInteraction(tmdbId);
  const updateEpisodeInteractionMutation = useUpdateEpisodeInteraction(tmdbId, season.seasonNumber);

  const upsertSeasonReviewMutation = useUpsertSeasonReview(tmdbId, season.seasonNumber);
  const deleteSeasonReviewMutation = useDeleteSeasonReview(tmdbId, season.seasonNumber);

  const upsertEpisodeReviewMutation = useUpsertEpisodeReview(tmdbId, season.seasonNumber, activeEpisodeNumber ?? 0);
  const deleteEpisodeReviewMutation = useDeleteEpisodeReview(tmdbId, season.seasonNumber, activeEpisodeNumber ?? 0);

  // Hydrate the draft fields once each review query resolves (or when a
  // different season/episode's review loads). Adjusted during render
  // instead of in an effect to avoid an extra commit + repaint.
  const [prevSeasonReviewData, setPrevSeasonReviewData] = useState(seasonReviewQuery.data);
  if (seasonReviewQuery.data !== prevSeasonReviewData) {
    setPrevSeasonReviewData(seasonReviewQuery.data);
    setSeasonReviewContent(seasonReviewQuery.data?.content ?? "");
    setSeasonReviewContainsSpoilers(seasonReviewQuery.data?.containsSpoilers ?? false);
  }

  const [prevEpisodeReviewData, setPrevEpisodeReviewData] = useState(episodeReviewQuery.data);
  if (episodeReviewQuery.data !== prevEpisodeReviewData) {
    setPrevEpisodeReviewData(episodeReviewQuery.data);
    setEpisodeReviewContent(episodeReviewQuery.data?.content ?? "");
    setEpisodeReviewContainsSpoilers(episodeReviewQuery.data?.containsSpoilers ?? false);
  }

  const handleSeasonWatchedChange = (nextWatched: boolean) => {
    updateSeasonInteractionMutation.mutate({
      seasonNumber: season.seasonNumber,
      input: { watched: nextWatched },
    });
  };

  const handleSeasonWatchedToggle = () => handleSeasonWatchedChange(!(season.viewerInteraction?.watched ?? false));

  const handleSeasonLikedChange = (nextLiked: boolean) => {
    updateSeasonInteractionMutation.mutate({
      seasonNumber: season.seasonNumber,
      input: { liked: nextLiked },
    });
  };

  const handleSeasonLikedToggle = () => handleSeasonLikedChange(!(season.viewerInteraction?.liked ?? false));

  const handleSeasonRatingChange = (nextRating: number | null) => {
    updateSeasonInteractionMutation.mutate({
      seasonNumber: season.seasonNumber,
      input: { rating: nextRating },
    });
  };

  const handleSeasonReviewSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!seasonReviewContent.trim()) {
      setSeasonFormError("Please write a review before saving.");
      return;
    }
    setSeasonFormError(null);
    try {
      await upsertSeasonReviewMutation.mutateAsync({
        content: seasonReviewContent.trim(),
        containsSpoilers: seasonReviewContainsSpoilers,
      });
      setActiveReviewModal(null);
    } catch {
      setSeasonFormError("Failed to save the review. Please try again.");
    }
  };

  const handleSeasonReviewDelete = async () => {
    await deleteSeasonReviewMutation.mutateAsync();
    setActiveReviewModal(null);
  };

  const handleEpisodeWatchedChange = (episodeNumber: number, nextWatched: boolean) => {
    updateEpisodeInteractionMutation.mutate({
      episodeNumber,
      input: { watched: nextWatched },
    });
  };

  const handleEpisodeWatchedToggle = (episodeNumber: number, currentWatched: boolean) => {
    handleEpisodeWatchedChange(episodeNumber, !currentWatched);
  };

  const handleEpisodeLikedChange = (episodeNumber: number, nextLiked: boolean) => {
    updateEpisodeInteractionMutation.mutate({
      episodeNumber,
      input: { liked: nextLiked },
    });
  };

  const handleEpisodeLikedToggle = (episodeNumber: number, currentLiked: boolean) => {
    handleEpisodeLikedChange(episodeNumber, !currentLiked);
  };

  const handleEpisodeRatingChange = (episodeNumber: number, nextRating: number | null) => {
    updateEpisodeInteractionMutation.mutate({
      episodeNumber,
      input: { rating: nextRating },
    });
  };

  const handleEpisodeReviewSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (activeReviewModal?.type !== "episode") return;
    if (!episodeReviewContent.trim()) {
      setEpisodeFormError("Please write a review before saving.");
      return;
    }
    setEpisodeFormError(null);
    try {
      await upsertEpisodeReviewMutation.mutateAsync({
        content: episodeReviewContent.trim(),
        containsSpoilers: episodeReviewContainsSpoilers,
      });
      setActiveReviewModal(null);
    } catch {
      setEpisodeFormError("Failed to save the review. Please try again.");
    }
  };

  const handleEpisodeReviewDelete = async () => {
    if (activeReviewModal?.type !== "episode") return;
    await deleteEpisodeReviewMutation.mutateAsync();
    setActiveReviewModal(null);
  };

  const seasonWatched = season.viewerInteraction?.watched ?? false;
  const seasonLiked = season.viewerInteraction?.liked ?? false;
  const seasonRating = season.viewerInteraction?.rating ?? null;
  const seasonHasReview = season.viewerInteraction?.hasReview ?? false;

  return (
    <div
      className="overflow-hidden border"
      style={{
        borderColor: SERIAL_MODULE_STYLES.border,
        background: SERIAL_MODULE_STYLES.panel,
      }}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        onClick={onToggle}
      >
        <div className="flex flex-1 flex-wrap items-center justify-between gap-3 mr-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-7 w-7 items-center justify-center"
              style={{ background: SERIAL_MODULE_STYLES.panelStrong }}
            >
              <span
                className="font-mono text-[11px]"
                style={{ color: SERIAL_MODULE_STYLES.accent }}
              >
                {season.seasonNumber}
              </span>
            </div>

            <div>
              <p
                className="font-mono text-xs font-bold"
                style={{ color: SERIAL_MODULE_STYLES.text }}
              >
                {season.name || `Season ${season.seasonNumber}`}
              </p>
              <p
                className="font-mono text-[10px]"
                style={{ color: SERIAL_MODULE_STYLES.muted }}
              >
                {season.episodeCount ?? "?"} episodes ·{" "}
                {toYearFromDateLabel(season.airDate)}
              </p>
            </div>
          </div>

          {user && season.viewerInteraction && (
            <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={handleSeasonWatchedToggle}
                className="flex h-7 px-2 items-center justify-center border font-mono text-[9px] uppercase font-bold transition-all hover:bg-secondary/40"
                style={{
                  borderColor: seasonWatched ? SERIAL_MODULE_STYLES.accent : SERIAL_MODULE_STYLES.borderSoft,
                  color: seasonWatched ? SERIAL_MODULE_STYLES.accent : SERIAL_MODULE_STYLES.muted,
                  background: seasonWatched ? "color-mix(in srgb, var(--module-serial) 12%, transparent)" : "transparent",
                }}
                title="Mark Season as Watched"
              >
                {seasonWatched ? "Watched" : "Unwatched"}
              </button>

              <button
                type="button"
                onClick={handleSeasonLikedToggle}
                className="flex h-7 w-7 items-center justify-center border transition-all hover:bg-secondary/40"
                style={{
                  borderColor: seasonLiked ? "#ef4444" : SERIAL_MODULE_STYLES.borderSoft,
                  color: seasonLiked ? "#ef4444" : SERIAL_MODULE_STYLES.muted,
                  background: seasonLiked ? "rgba(239, 68, 68, 0.1)" : "transparent",
                }}
                title="Like Season"
              >
                <Heart className="h-3 w-3" fill={seasonLiked ? "#ef4444" : "none"} />
              </button>

              <select
                value={seasonRating ?? ""}
                onChange={(e) => {
                  const val = e.target.value ? parseFloat(e.target.value) : null;
                  handleSeasonRatingChange(val);
                }}
                className="h-7 rounded border bg-background/30 px-1 font-mono text-[9px] text-muted-foreground outline-none focus:border-primary"
                style={{ borderColor: SERIAL_MODULE_STYLES.borderSoft }}
              >
                <option value="" className="bg-card">★ --</option>
                <option value="0.5" className="bg-card">★ 0.5</option>
                <option value="1" className="bg-card">★ 1.0</option>
                <option value="1.5" className="bg-card">★ 1.5</option>
                <option value="2" className="bg-card">★ 2.0</option>
                <option value="2.5" className="bg-card">★ 2.5</option>
                <option value="3" className="bg-card">★ 3.0</option>
                <option value="3.5" className="bg-card">★ 3.5</option>
                <option value="4" className="bg-card">★ 4.0</option>
                <option value="4.5" className="bg-card">★ 4.5</option>
                <option value="5" className="bg-card">★ 5.0</option>
                <option value="5.5" className="bg-card">★ 5.5</option>
                <option value="6" className="bg-card">★ 6.0</option>
                <option value="6.5" className="bg-card">★ 6.5</option>
                <option value="7" className="bg-card">★ 7.0</option>
                <option value="7.5" className="bg-card">★ 7.5</option>
                <option value="8" className="bg-card">★ 8.0</option>
                <option value="8.5" className="bg-card">★ 8.5</option>
                <option value="9" className="bg-card">★ 9.0</option>
                <option value="9.5" className="bg-card">★ 9.5</option>
                <option value="10" className="bg-card">★ 10.0</option>
              </select>

              <button
                type="button"
                onClick={() => setActiveReviewModal({ type: "season" })}
                className="flex h-7 px-2 items-center gap-1 border font-mono text-[9px] uppercase font-bold transition-all hover:bg-secondary/40"
                style={{
                  borderColor: seasonHasReview ? SERIAL_MODULE_STYLES.accent : SERIAL_MODULE_STYLES.borderSoft,
                  color: seasonHasReview ? SERIAL_MODULE_STYLES.accent : SERIAL_MODULE_STYLES.muted,
                  background: seasonHasReview ? "color-mix(in srgb, var(--module-serial) 12%, transparent)" : "transparent",
                }}
                title="Review Season"
              >
                <MessageSquare className="h-2.5 w-2.5" />
                <span>{seasonHasReview ? "Edit Review" : "Review"}</span>
              </button>
            </div>
          )}
        </div>

        {isOpen ? (
          <ChevronUp
            className="h-4 w-4"
            style={{ color: SERIAL_MODULE_STYLES.accent }}
          />
        ) : (
          <ChevronDown
            className="h-4 w-4"
            style={{ color: SERIAL_MODULE_STYLES.accent }}
          />
        )}
      </button>

      {isOpen ? (
        <div
          className="border-t"
          style={{ borderColor: SERIAL_MODULE_STYLES.borderSoft }}
        >
          {seasonDetailQuery.isPending ? (
            <div
              className="px-4 py-3 font-mono text-xs"
              style={{ color: SERIAL_MODULE_STYLES.muted }}
            >
              Loading episodes...
            </div>
          ) : null}

          {seasonDetailQuery.isError ? (
            <div
              className="px-4 py-3 font-mono text-xs text-destructive"
              style={{
                background:
                  "color-mix(in srgb, var(--destructive) 10%, transparent)",
              }}
            >
              Could not load episodes for this season.
            </div>
          ) : null}

          {!seasonDetailQuery.isPending &&
          !seasonDetailQuery.isError &&
          episodes.length === 0 ? (
            <div
              className="px-4 py-3 font-mono text-xs"
              style={{ color: SERIAL_MODULE_STYLES.muted }}
            >
              No episodes available for this season.
            </div>
          ) : null}

          {!seasonDetailQuery.isPending &&
          !seasonDetailQuery.isError &&
          episodes.length > 0
            ? episodes.map((episode, index) => {
                const epWatched = episode.viewerInteraction?.watched ?? false;
                const epLiked = episode.viewerInteraction?.liked ?? false;
                const epRating = episode.viewerInteraction?.rating ?? null;
                const epHasReview = episode.viewerInteraction?.hasReview ?? false;

                return (
                  <article
                    key={`episode-${episode.id}`}
                    className={`grid grid-cols-[104px_minmax(0,1fr)] gap-3 p-3 ${
                      index > 0 ? "border-t" : ""
                    }`}
                    style={{
                      borderColor: SERIAL_MODULE_STYLES.borderSoft,
                      background:
                        index % 2 === 0
                          ? "transparent"
                          : "color-mix(in srgb, var(--module-serial) 4%, transparent)",
                    }}
                  >
                    <div
                      className="relative aspect-video overflow-hidden border"
                      style={{
                        borderColor: SERIAL_MODULE_STYLES.borderSoft,
                        background: SERIAL_MODULE_STYLES.panelSoft,
                      }}
                    >
                      <img
                        alt={episode.name}
                        className="h-full w-full object-cover"
                        src={getStillUrl(episode.stillPath)}
                      />

                      {episode.runtimeLabel ? (
                        <span className="absolute bottom-1 right-1 bg-black/65 px-1.5 py-0.5 font-mono text-[9px] text-white/85">
                          {episode.runtimeLabel}
                        </span>
                      ) : null}
                    </div>

                    <div className="min-w-0">
                      <div className="mb-1 flex items-center gap-2">
                        <span
                          className="font-mono text-[10px]"
                          style={{ color: SERIAL_MODULE_STYLES.faint }}
                        >
                          {toEpisodeCodeLabel(episode.episodeNumber)}
                        </span>
                        <h4
                          className="truncate font-mono text-xs font-bold"
                          style={{ color: SERIAL_MODULE_STYLES.text }}
                        >
                          {episode.name}
                        </h4>
                      </div>

                      <p
                        className="line-clamp-2 text-xs leading-relaxed"
                        style={{ color: SERIAL_MODULE_STYLES.muted }}
                      >
                        {episode.overview ||
                          "No synopsis available for this episode."}
                      </p>

                      <div className="mt-1.5 flex flex-wrap items-center gap-4">
                        <p
                          className="font-mono text-[10px]"
                          style={{ color: SERIAL_MODULE_STYLES.faint }}
                        >
                          {toDateLabel(episode.airDate) ?? "Air date unknown"}
                        </p>

                        {user && episode.viewerInteraction && (
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleEpisodeWatchedToggle(episode.episodeNumber, epWatched)}
                              className="flex h-6 px-1.5 items-center justify-center border font-mono text-[8px] uppercase font-bold transition-all hover:bg-secondary/40"
                              style={{
                                borderColor: epWatched ? SERIAL_MODULE_STYLES.accent : SERIAL_MODULE_STYLES.borderSoft,
                                color: epWatched ? SERIAL_MODULE_STYLES.accent : SERIAL_MODULE_STYLES.muted,
                                background: epWatched ? "color-mix(in srgb, var(--module-serial) 12%, transparent)" : "transparent",
                              }}
                              title="Mark Episode as Watched"
                            >
                              {epWatched ? "Watched" : "Unwatched"}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleEpisodeLikedToggle(episode.episodeNumber, epLiked)}
                              className="flex h-6 w-6 items-center justify-center border transition-all hover:bg-secondary/40"
                              style={{
                                borderColor: epLiked ? "#ef4444" : SERIAL_MODULE_STYLES.borderSoft,
                                color: epLiked ? "#ef4444" : SERIAL_MODULE_STYLES.muted,
                                background: epLiked ? "rgba(239, 68, 68, 0.1)" : "transparent",
                              }}
                              title="Like Episode"
                            >
                              <Heart className="h-2.5 w-2.5" fill={epLiked ? "#ef4444" : "none"} />
                            </button>

                            <select
                              value={epRating ?? ""}
                              onChange={(e) => {
                                const val = e.target.value ? parseFloat(e.target.value) : null;
                                handleEpisodeRatingChange(episode.episodeNumber, val);
                              }}
                              className="h-6 rounded border bg-background/30 px-1 font-mono text-[8px] text-muted-foreground outline-none focus:border-primary"
                              style={{ borderColor: SERIAL_MODULE_STYLES.borderSoft }}
                            >
                              <option value="" className="bg-card">★ --</option>
                              <option value="0.5" className="bg-card">★ 0.5</option>
                              <option value="1" className="bg-card">★ 1.0</option>
                              <option value="1.5" className="bg-card">★ 1.5</option>
                              <option value="2" className="bg-card">★ 2.0</option>
                              <option value="2.5" className="bg-card">★ 2.5</option>
                              <option value="3" className="bg-card">★ 3.0</option>
                              <option value="3.5" className="bg-card">★ 3.5</option>
                              <option value="4" className="bg-card">★ 4.0</option>
                              <option value="4.5" className="bg-card">★ 4.5</option>
                              <option value="5" className="bg-card">★ 5.0</option>
                              <option value="5.5" className="bg-card">★ 5.5</option>
                              <option value="6" className="bg-card">★ 6.0</option>
                              <option value="6.5" className="bg-card">★ 6.5</option>
                              <option value="7" className="bg-card">★ 7.0</option>
                              <option value="7.5" className="bg-card">★ 7.5</option>
                              <option value="8" className="bg-card">★ 8.0</option>
                              <option value="8.5" className="bg-card">★ 8.5</option>
                              <option value="9" className="bg-card">★ 9.0</option>
                              <option value="9.5" className="bg-card">★ 9.5</option>
                              <option value="10" className="bg-card">★ 10.0</option>
                            </select>

                            <button
                              type="button"
                              onClick={() => setActiveReviewModal({ type: "episode", episodeNumber: episode.episodeNumber, episodeName: episode.name })}
                              className="flex h-6 px-1.5 items-center gap-1 border font-mono text-[8px] uppercase font-bold transition-all hover:bg-secondary/40"
                              style={{
                                borderColor: epHasReview ? SERIAL_MODULE_STYLES.accent : SERIAL_MODULE_STYLES.borderSoft,
                                color: epHasReview ? SERIAL_MODULE_STYLES.accent : SERIAL_MODULE_STYLES.muted,
                                background: epHasReview ? "color-mix(in srgb, var(--module-serial) 12%, transparent)" : "transparent",
                              }}
                              title="Review Episode"
                            >
                              <MessageSquare className="h-2 w-2" />
                              <span>{epHasReview ? "Edit Review" : "Review"}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })
            : null}
        </div>
      ) : null}

      {activeReviewModal?.type === "season" && createPortal(
        <LogMediaDialog
          title={season.name || `Season ${season.seasonNumber}`}
          subtitle="Season Review"
          posterUrl={getPosterUrl(season.posterPath)}
          review={seasonReviewContent}
          onReviewChange={setSeasonReviewContent}
          containsSpoilers={seasonReviewContainsSpoilers}
          onContainsSpoilersChange={setSeasonReviewContainsSpoilers}
          rating={seasonRating}
          onRatingChange={handleSeasonRatingChange}
          liked={seasonLiked}
          onLikedChange={handleSeasonLikedChange}
          watched={seasonWatched}
          onWatchedChange={handleSeasonWatchedChange}
          isSubmitting={upsertSeasonReviewMutation.isPending || deleteSeasonReviewMutation.isPending}
          onClose={() => { setActiveReviewModal(null); setSeasonFormError(null); }}
          onSubmit={handleSeasonReviewSubmit}
          onDelete={seasonReviewQuery.data?.content ? handleSeasonReviewDelete : undefined}
          submitLabel="Save"
          formError={seasonFormError}
          reviewMaxLength={10000}
          reviewPlaceholder="Share your thoughts about this season..."
        />,
        document.body,
      )}

      {activeReviewModal?.type === "episode" && (() => {
        const selectedEpisode = episodes.find((e) => e.episodeNumber === activeReviewModal.episodeNumber);
        const epWatched = selectedEpisode?.viewerInteraction?.watched ?? false;
        const epLiked = selectedEpisode?.viewerInteraction?.liked ?? false;
        const epRating = selectedEpisode?.viewerInteraction?.rating ?? null;

        return createPortal(
          <LogMediaDialog
            title={season.name || `Season ${season.seasonNumber}`}
            subtitle={`Episode ${activeReviewModal.episodeNumber}: ${activeReviewModal.episodeName}`}
            posterUrl={getPosterUrl(season.posterPath)}
            review={episodeReviewContent}
            onReviewChange={setEpisodeReviewContent}
            containsSpoilers={episodeReviewContainsSpoilers}
            onContainsSpoilersChange={setEpisodeReviewContainsSpoilers}
            rating={epRating}
            onRatingChange={(nextRating) => handleEpisodeRatingChange(activeReviewModal.episodeNumber, nextRating)}
            liked={epLiked}
            onLikedChange={(nextLiked) => handleEpisodeLikedChange(activeReviewModal.episodeNumber, nextLiked)}
            watched={epWatched}
            onWatchedChange={(nextWatched) => handleEpisodeWatchedChange(activeReviewModal.episodeNumber, nextWatched)}
            isSubmitting={upsertEpisodeReviewMutation.isPending || deleteEpisodeReviewMutation.isPending}
            onClose={() => { setActiveReviewModal(null); setEpisodeFormError(null); }}
            onSubmit={handleEpisodeReviewSubmit}
            onDelete={episodeReviewQuery.data?.content ? handleEpisodeReviewDelete : undefined}
            submitLabel="Save"
            formError={episodeFormError}
            reviewMaxLength={10000}
            reviewPlaceholder="Share your thoughts about this episode..."
          />,
          document.body,
        );
      })()}
    </div>
  );
};
