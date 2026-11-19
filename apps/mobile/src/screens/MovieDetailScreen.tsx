import { useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Bookmark, Eye, Heart } from "lucide-react-native";
import { formatRuntimeLabel } from "@/lib/media";
import { useTheme } from "@/theme";
import type { ReviewSort } from "@/types/common";
import { useAuth } from "@/hooks/useAuth";
import { movieKeys, useMovieDetail, useMovieInteraction, useUpdateMovieInteraction } from "@/hooks/useMovies";
import { useLogMedia } from "@/hooks/useLogMedia";
import { useToggleReviewLike } from "@/hooks/useReviews";
import { AppText, ErrorView, LoadingView, Screen, SectionHeader } from "@/components/ui";
import { MediaHero } from "@/components/media/MediaHero";
import { MediaActionBar } from "@/components/media/MediaActionBar";
import { CastRail } from "@/components/media/CastRail";
import { PosterRail } from "@/components/media/PosterRail";
import { RatingBreakdown } from "@/components/media/RatingBreakdown";
import { LogMediaSheet } from "@/components/media/LogMediaSheet";
import {
  GenrePills,
  GuestPrompt,
  ReviewsSection,
  StatStrip,
  ViewerRatingPanel,
} from "@/components/media/MediaDetailSections";

export const MovieDetailScreen = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ tmdbId: string }>();
  const tmdbId = Number(params.tmdbId);
  const [reviewsSort, setReviewsSort] = useState<ReviewSort>("popular");
  const [isLogOpen, setIsLogOpen] = useState(false);

  const { user } = useAuth();
  const detailQuery = useMovieDetail(tmdbId, reviewsSort);
  const interactionQuery = useMovieInteraction(tmdbId, Boolean(user));
  const updateInteraction = useUpdateMovieInteraction(tmdbId);
  const logMutation = useLogMedia("movie", tmdbId, user?.username ?? null);
  const { mutate: toggleReviewLike } = useToggleReviewLike(movieKeys.detailRoot(tmdbId));

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
          message="Could not load this movie right now."
          onRetry={() => void detailQuery.refetch()}
        />
      </Screen>
    );
  }

  const detail = detailQuery.data;
  const movie = detail.movie;
  const accent = colors.movie;
  const interaction = interactionQuery.data;
  const watched = interaction?.watched ?? false;
  const liked = interaction?.liked ?? false;
  const watchlisted = interaction?.watchlisted ?? false;
  const currentRating = interaction?.rating ?? detail.userRating?.rating ?? null;

  // A liked or rated movie asks first whether the like and rating go too
  // (the web's UnwatchMovieDialog, #93).
  const handleToggleWatched = () => {
    if (watched && (liked || interaction?.rating != null)) {
      Alert.alert("Mark as unwatched?", "Also remove your like and rating for this movie?", [
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
    movie.releaseYear,
    movie.director ? `Dir. ${movie.director}` : null,
    formatRuntimeLabel(movie.runtime),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        <MediaHero
          kicker="Movie"
          accentColor={accent}
          title={movie.title}
          backdropPath={movie.backdropPath}
          posterPath={movie.posterPath}
          metaLine={metaLine}
          tagline={movie.tagline}
        />

        <View style={{ paddingHorizontal: 16, paddingTop: 18, gap: 18 }}>
          <GenrePills genres={movie.genres} accentColor={accent} />

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

          {movie.overview ? (
            <View>
              <SectionHeader label="Overview" color={accent} />
              <AppText size={15} style={{ lineHeight: 23 }}>
                {movie.overview}
              </AppText>
            </View>
          ) : null}

          <StatStrip
            stats={[
              { label: "Logs", value: detail.logsCount },
              { label: "Reviews", value: detail.reviewCount },
              { label: "Language", value: movie.languageCode?.toUpperCase() ?? "—" },
            ]}
          />

          <RatingBreakdown
            accentColor={accent}
            averageRating={detail.ratingBreakdown.averageRating}
            totalRated={detail.ratingBreakdown.totalRatedReviews}
            buckets={detail.ratingBreakdown.buckets}
            globalRating={movie.globalRating}
          />
        </View>

        <View style={{ gap: 26, marginTop: 26 }}>
          <CastRail label="Cast" people={movie.cast} />
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
              year: item.releaseYear,
              mediaType: "movie",
            }))}
          />
        </View>
      </ScrollView>

      {isLogOpen ? (
        <LogMediaSheet
          isOpen
          onClose={() => setIsLogOpen(false)}
          title={movie.title}
          kicker="Log movie"
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
