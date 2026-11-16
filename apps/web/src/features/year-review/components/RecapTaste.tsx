import { RankedBars } from "@/features/profile/components/stats/StatsCharts";
import type { YearReview } from "@/features/year-review/api";
import { RecapSection } from "./RecapBlocks";

const Ranked = ({ title, rows }: { title: string; rows: { label: string; count: number; slug?: string | null }[] }) =>
  rows.length > 0 ? (
    <div>
      <p className="kicker mb-2 text-muted-foreground">{title}</p>
      <RankedBars rows={rows} />
    </div>
  ) : null;

// What they watched: genres and decades (each title once), and directors of their Films.
export const RecapTaste = ({ review }: { review: YearReview }) => {
  const genre = review.topGenres[0];
  const director = review.topDirectors[0];
  if (!genre && !director && review.decades.length === 0) return null;

  const title = genre
    ? `${genre.genre} led the way, in ${genre.count === 1 ? "one title" : `${genre.count} titles`}.`
    : director
      ? `${director.director} was the most-watched director.`
      : "A year across the decades.";

  return (
    <RecapSection label="Taste" year={review.year} title={title}>
      <div className="mt-8 grid gap-8 md:grid-cols-3">
        <Ranked title="Top genres" rows={review.topGenres.map((row) => ({ label: row.genre, count: row.count }))} />
        <Ranked
          title="Top directors"
          rows={review.topDirectors.map((row) => ({ label: row.director, count: row.count, slug: row.slug }))}
        />
        <Ranked title="Decades" rows={review.decades.map((row) => ({ label: `${row.decade}s`, count: row.count }))} />
      </div>
    </RecapSection>
  );
};
