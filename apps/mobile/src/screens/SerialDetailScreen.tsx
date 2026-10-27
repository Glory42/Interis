import { useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Bookmark, Eye, Heart } from "lucide-react-native";
import { useTheme } from "@/theme";
import type { ReviewSort } from "@/types/common";
import type { UserSetSerialWatchStatus } from "@/types/serials";
import { useAuth } from "@/hooks/useAuth";
import {
  serialKeys,
  useSeriesDetail,
  useSeriesInteraction,
  useUpdateSeriesInteraction,
} from "@/hooks/useSerials";
import { useLogMedia } from "@/hooks/useLogMedia";
import { useToggleReviewLike } from "@/hooks/useReviews";
import { AppText, ChipRow, ErrorView, LoadingView, Screen, SectionHeader, Surface } from "@/components/ui";
import { MediaHero } from "@/components/media/MediaHero";
import { MediaActionBar } from "@/components/media/MediaActionBar";
import { CastRail } from "@/components/media/CastRail";
import { PosterRail } from "@/components/media/PosterRail";
import { RatingBreakdown } from "@/components/media/RatingBreakdown";
import { LogMediaSheet } from "@/components/media/LogMediaSheet";
import { SeasonList } from "@/components/media/SeasonList";
import {
  GenrePills,
  GuestPrompt,
  ReviewsSection,
  StatStrip,
  ViewerRatingPanel,
} from "@/components/media/MediaDetailSections";

const NO_STATUS = "none";
type StatusChoice = UserSetSerialWatchStatus | typeof NO_STATUS;

export const SerialDetailScreen = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ tmdbId: string }>();
  const tmdbId = Number(params.tmdbId);
  const [reviewsSort, setReviewsSort] = useState<ReviewSort>("popular");
  const [isLogOpen, setIsLogOpen] = useState(false);

  const { user } = useAuth();
  const detailQuery = useSeriesDetail(tmdbId, reviewsSort);
  const interactionQuery = useSeriesInteraction(tmdbId, Boolean(user));
  const updateInteraction = useUpdateSeriesInteraction(tmdbId);
  const logMutation = useLogMedia("tv", tmdbId, user?.username ?? null);
  const { mutate: toggleReviewLike } = useToggleReviewLike(serialKeys.detailRoot(tmdbId));

  if (detailQuery.isPending) {
    return (
      <Screen>
        <LoadingView style={{ paddingTop: 140 }} />
      </Screen>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <Screen>
        <ErrorView
          style={{ paddingTop: 120 }}
          message="Could not load this series right now."
          onRetry={() => void detailQuery.refetch()}
        />
      </Screen>
    );
  }

  const detail = detailQuery.data;
  const series = detail.series;
  const accent = colors.serial;
  const interaction = interactionQuery.data;
  const watched = interaction?.watched ?? false;
  const liked = interaction?.liked ?? false;
  const watchlisted = interaction?.watchlisted ?? false;
  const currentRating = interaction?.rating ?? detail.userRating?.rating ?? null;
  const watchStatus = interaction?.watchStatus ?? null;
  const tracking = detail.viewerTracking;

  const handleToggleWatched = () => {
    if (watched && (liked || interaction?.rating != null)) {
      Alert.alert("Mark as unwatched?", "Also remove your like and rating for this series?", [
        { text: "Cancel", style: "cancel" },
        { text: "Keep them", onPress: () => updateInteraction.mutate({ watched: false }) },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => updateInteraction.mutate({ watched: false, liked: false, rating: null }),
        },
      ]);
      return;
    }
    updateInteraction.mutate({ watched: !watched });
  };

  const metaLine = [
    series.firstAirYear,
    series.network,
    series.numberOfSeasons ? `${series.numberOfSeasons} seasons` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        <MediaHero
          kicker="Serial"
          accentColor={accent}
          title={series.title}
          backdropPath={series.backdropPath}
          posterPath={series.posterPath}
          metaLine={metaLine}
          tagline={series.tagline}
        />

        <View style={{ paddingHorizontal: 16, paddingTop: 18, gap: 18 }}>
          <GenrePills genres={series.genres} accentColor={accent} />

          {user ? (
            <>
              <MediaActionBar
                accentColor={accent}
                disabled={interactionQuery.isPending}
                actions={[
                  {
                    key: "watchlist",
                    label: "Watchlist",
                    activeLabel: "Listed",
                    isActive: watchlisted,
                    icon: (color) => <Bookmark size={18} color={color} fill={watchlisted ? color : "transparent"} />,
                    onPress: () => updateInteraction.mutate({ watchlisted: !watchlisted }),
                  },
                  {
                    key: "watched",
                    label: "Watch",
                    activeLabel: "Watched",
                    isActive: watched,
                    icon: (color) => <Eye size={18} color={color} />,
                    onPress: handleToggleWatched,
                  },
                  {
                    key: "liked",
                    label: "Like",
                    activeLabel: "Liked",
                    isActive: liked,
                    icon: (color) => <Heart size={18} color={color} fill={liked ? color : "transparent"} />,
                    onPress: () => updateInteraction.mutate({ liked: !liked }),
                  },
                ]}
              />

              {!watched ? (
                <View style={{ marginHorizontal: -16 }}>
                  <ChipRow<StatusChoice>
                    options={[
                      { value: NO_STATUS, label: "No status" },
                      { value: "watching", label: "Watching" },
                      { value: "paused", label: "Paused" },
                      { value: "dropped", label: "Dropped" },
                    ]}
                    value={watchStatus && watchStatus !== "completed" ? watchStatus : NO_STATUS}
                    onChange={(next) => {
                      if (next !== NO_STATUS) {
                        updateInteraction.mutate({ watchStatus: next });
                      }
                    }}
                    accentColor={accent}
                  />
                </View>
              ) : null}

              {tracking && tracking.watchedEpisodesCount > 0 ? (
                <Surface accentColor={accent}>
                  <AppText variant="kicker" size={9} color={accent}>
                    Your progress
                  </AppText>
                  <AppText style={{ marginTop: 4 }}>
                    {tracking.watchedEpisodesCount}
                    {series.numberOfEpisodes ? ` / ${series.numberOfEpisodes}` : ""} episodes watched
                  </AppText>
                  {tracking.currentEpisode ? (
                    <AppText size={13} tone="muted" style={{ marginTop: 2 }}>
                      Up next: S{tracking.currentEpisode.seasonNumber}E{tracking.currentEpisode.episodeNumber} ·{" "}
                      {tracking.currentEpisode.name}
                    </AppText>
                  ) : null}
                </Surface>
              ) : null}

              <ViewerRatingPanel
                accentColor={accent}
                rating={currentRating}
                disabled={interactionQuery.isPending}
                onChange={(rating) => updateInteraction.mutate({ rating })}
                onLog={() => setIsLogOpen(true)}
              />
            </>
          ) : (
            <GuestPrompt onSignIn={() => router.push("/login")} />
          )}

          {series.overview ? (
            <View>
              <SectionHeader label="Overview" color={accent} />
              <AppText size={15} style={{ lineHeight: 23 }}>
                {series.overview}
              </AppText>
            </View>
          ) : null}

          <StatStrip
            stats={[
              { label: "Logs", value: detail.logsCount },
              { label: "Reviews", value: detail.reviewCount },
              { label: "Episodes", value: series.numberOfEpisodes ?? "—" },
            ]}
          />

          <SeasonList tmdbId={tmdbId} seasons={series.seasons} />

          <RatingBreakdown
            accentColor={accent}
            averageRating={detail.ratingBreakdown.averageRating}
            totalRated={detail.ratingBreakdown.totalRatedReviews}
            buckets={detail.ratingBreakdown.buckets}
            globalRating={series.globalRating}
          />
        </View>

        <View style={{ gap: 26, marginTop: 26 }}>
          <CastRail label="Cast" people={series.cast} />
          <ReviewsSection
            accentColor={accent}
            reviews={detail.reviews}
            totalCount={detail.reviewCount}
            sort={reviewsSort}
            onSortChange={setReviewsSort}
            onToggleLike={
              user ? (review) => toggleReviewLike({ reviewId: review.id, liked: !review.viewerHasLiked }) : undefined
            }
          />
          <PosterRail
            label="Similar"
            color={accent}
            items={detail.similar.map((item) => ({
              tmdbId: item.tmdbId,
              title: item.title,
              posterPath: item.posterPath,
              year: item.firstAirYear,
              mediaType: "tv",
            }))}
          />
        </View>
      </ScrollView>

      {isLogOpen ? (
        <LogMediaSheet
          isOpen
          onClose={() => setIsLogOpen(false)}
          title={series.title}
          kicker="Log series"
          accentColor={accent}
          initialRating={currentRating}
          isSubmitting={logMutation.isPending}
          onSubmit={async (input) => {
            await logMutation.mutateAsync(input);
          }}
        />
      ) : null}
    </Screen>
  );
};
