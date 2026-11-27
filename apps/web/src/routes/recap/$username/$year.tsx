import { useCallback, useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { getYearReview } from "@/features/year-review/api";
import { yearReviewKeys } from "@/features/year-review/hooks/useYearReview";
import { YEAR_REVIEW_MIN_YEAR } from "@/features/year-review/year-review-model";
import { buildStory } from "@/features/year-review/story/build-story";
import { StoryPlaceholder } from "@/features/year-review/story/story-placeholder";
import { StoryPlayer } from "@/features/year-review/story/story-player";
import type { StoryActions, StorySlide } from "@/features/year-review/story/story.types";
import { recapShareText, shareCardUrl, shareHeadMeta } from "@/lib/share-meta";

const parseYear = (value: string): number | null => {
  const year = Number(value);
  return /^\d{4}$/.test(value) && year >= YEAR_REVIEW_MIN_YEAR && year <= new Date().getFullYear()
    ? year
    : null;
};

export const Route = createFileRoute("/recap/$username/$year")({
  validateSearch: (search: Record<string, unknown>) => ({
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
  const slides = useMemo(() => (review ? buildStory(review) : []), [review]);

  const handleSlideChange = useCallback(
    (next: StorySlide) => {
      void navigate({
        to: "/recap/$username/$year",
        params: { username, year },
        search: { slide: next.id },
        replace: true,
      });
    },
    [navigate, username, year],
  );

  const handleExit = useCallback(() => {
    void navigate({ to: "/profile/$username/stats", params: { username } });
  }, [navigate, username]);

  const renderSlide = useCallback(
    (next: StorySlide, actions: StoryActions) => (
      <StoryPlaceholder slide={next} actions={actions} />
    ),
    [],
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
      onExit={handleExit}
      renderSlide={renderSlide}
    />
  );
}
