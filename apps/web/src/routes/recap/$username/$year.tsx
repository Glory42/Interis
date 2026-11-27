import { useCallback, useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useIsOwnProfile } from "@/features/profile/hooks/useProfile";
import { getYearReview } from "@/features/year-review/api";
import { yearReviewKeys } from "@/features/year-review/hooks/useYearReview";
import { YEAR_REVIEW_MIN_YEAR } from "@/features/year-review/year-review-model";
import { buildStory } from "@/features/year-review/story/build-story";
import { StoryPlayer } from "@/features/year-review/story/story-player";
import { StorySlideRenderer } from "@/features/year-review/story/story-slide-renderer";
import { shareStoryCard } from "@/features/year-review/story/story-share";
import type { StoryActions, StorySlide } from "@/features/year-review/story/story.types";
import { recapShareText, shareCardUrl, shareHeadMeta } from "@/lib/share-meta";

const parseYear = (value: string): number | null => {
  const year = Number(value);
  return /^\d{4}$/.test(value) && year >= YEAR_REVIEW_MIN_YEAR && year <= new Date().getFullYear()
    ? year
    : null;
};

export const Route = createFileRoute("/recap/$username/$year")({
  validateSearch: (search: Record<string, unknown>): { slide?: string } => ({
    slide: typeof search.slide === "string" ? search.slide : undefined,
  }),
  loader: async ({ context, params }) => {
    const year = parseYear(params.year);
    if (year === null) return null;
    return context.queryClient
      .fetchQuery({
        queryKey: yearReviewKeys.detail(params.username, year),
        queryFn: ({ signal }) => getYearReview(params.username, year, { signal }),
      })
      .catch(() => null);
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return {};
    return {
      meta: shareHeadMeta(recapShareText(loaderData), {
        image: shareCardUrl("recap", `${loaderData.user.username}/${params.year}`),
        ogType: "website",
      }),
    };
  },
  component: RecapStoryRoute,
});

function RecapStoryRoute() {
  const { username, year } = Route.useParams();
  const { slide } = Route.useSearch();
  const review = Route.useLoaderData();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOwner = useIsOwnProfile(username);
  const isLoggedIn = Boolean(user);
  const reviewYear = review?.year ?? Number(year);
  const slides = useMemo(() => (review ? buildStory(review) : []), [review]);

  // Keep the deep link fresh without a router navigation on every card; a
  // pending slide navigation can otherwise land after Escape and bounce back.
  const handleSlideChange = useCallback((next: StorySlide) => {
    const url = new URL(window.location.href);
    url.searchParams.set("slide", next.id);
    window.history.replaceState(window.history.state, "", url);
  }, []);

  const handleExit = useCallback(() => {
    void navigate({ to: "/profile/$username/stats", params: { username } });
  }, [navigate, username]);

  const handleShare = useCallback(async () => {
    if (!review) return;
    await shareStoryCard({
      username: review.user.username,
      year: review.year,
      title: `${review.user.displayName}'s ${review.year} recap`,
    });
  }, [review]);

  const renderSlide = useCallback(
    (next: StorySlide, actions: StoryActions) => (
      <StorySlideRenderer
        slide={next}
        actions={actions}
        username={username}
        year={reviewYear}
        isOwner={isOwner}
        isLoggedIn={isLoggedIn}
      />
    ),
    [isLoggedIn, isOwner, reviewYear, username],
  );

  if (!review) {
    return (
      <p className="body-s text-muted-foreground">This year in review isn't available.</p>
    );
  }

  return (
    <StoryPlayer
      slides={slides}
      year={review.year}
      initialSlideId={slide}
      onSlideChange={handleSlideChange}
      onShare={handleShare}
      onExit={handleExit}
      renderSlide={renderSlide}
    />
  );
}
