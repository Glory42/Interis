type RatingBreakdownBucket = {
  ratingValue: number;
  count: number;
  percentage: number;
};

type RatingBreakdownChartProps = {
  buckets: RatingBreakdownBucket[];
  accentColor: string;
  faintColor: string;
};

// A compact sparkline-style histogram (one thin bar per rating value 1-10)
// instead of ten stacked full-width rows - same data, a fraction of the
// vertical space. Shared by the movie and serial detail pages.
export const RatingBreakdownChart = ({ buckets, accentColor, faintColor }: RatingBreakdownChartProps) => {
  const sortedBuckets = [...buckets].sort((a, b) => a.ratingValue - b.ratingValue);

  return (
    <section className="mt-6">
      <p className="theme-kicker mb-2 text-[9px]" style={{ color: faintColor }}>
        Rating Breakdown
      </p>

      <div className="flex h-10 items-end gap-1">
        {sortedBuckets.map((bucket) => (
          <div
            key={bucket.ratingValue}
            className="flex h-full flex-1 items-end"
            title={`${bucket.ratingValue}/10 · ${bucket.percentage}%`}
          >
            <div
              className="w-full rounded-sm transition-[height] duration-200"
              style={{
                height: `${Math.max(bucket.percentage, 3)}%`,
                background:
                  bucket.percentage > 0
                    ? accentColor
                    : `color-mix(in srgb, ${faintColor} 45%, transparent)`,
              }}
            />
          </div>
        ))}
      </div>

      <div className="mt-1 flex justify-between font-mono text-[8px]" style={{ color: faintColor }}>
        <span>1</span>
        <span>10</span>
      </div>
    </section>
  );
};
