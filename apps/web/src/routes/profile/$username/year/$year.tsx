import { createFileRoute } from "@tanstack/react-router";
import { getYearReview } from "@/features/year-review/api";
import { yearReviewKeys } from "@/features/year-review/hooks/useYearReview";
import { YearReviewPage } from "@/features/year-review/pages/YearReviewPage";
import { YEAR_REVIEW_MIN_YEAR } from "@/features/year-review/year-review-model";
import { recapShareText, shareCardUrl, shareHeadMeta } from "@/lib/share-meta";

const parseYear = (value: string): number | null => {
  const year = Number(value);
  return /^\d{4}$/.test(value) && year >= YEAR_REVIEW_MIN_YEAR && year <= new Date().getFullYear() ? year : null;
};

export const Route = createFileRoute("/profile/$username/year/$year")({
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
  component: YearReviewRoute,
});

function YearReviewRoute() {
  const params = Route.useParams();
  const year = parseYear(params.year);
  if (year === null) {
    return <p className="body-s text-muted-foreground">This year in review isn't available.</p>;
  }
  return <YearReviewPage key={year} username={params.username} year={year} />;
}
