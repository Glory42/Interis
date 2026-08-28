// The "Community" rating + secondary stat block repeated at the top of every
// media type's detail page (movie/serial pair it with TMDB's rating, book/
// album pair it with the review count) - byte-identical layout, only the
// secondary stat's source and label differ per module.
export type MediaStatsRowProps = {
  primaryValue: string;
  primaryCountLabel: string;
  secondaryLabel: string;
  secondaryValue: string;
  accentColor: string;
  mutedColor: string;
  faintColor: string;
  borderColor: string;
};

export const MediaStatsRow = ({
  primaryValue,
  primaryCountLabel,
  secondaryLabel,
  secondaryValue,
  accentColor,
  mutedColor,
  faintColor,
  borderColor,
}: MediaStatsRowProps) => {
  return (
    <div
      className="mb-8 flex flex-wrap items-center gap-8 border-b pb-8"
      style={{ borderColor }}
    >
      <div>
        <p
          className="mb-1 font-mono text-[9px] uppercase tracking-[0.22em]"
          style={{ color: faintColor }}
        >
          Community
        </p>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-2xl font-bold" style={{ color: accentColor }}>
            {primaryValue}
          </span>
          <span className="font-mono text-[10px]" style={{ color: faintColor }}>
            {primaryCountLabel}
          </span>
        </div>
      </div>

      <div>
        <p
          className="mb-1 font-mono text-[9px] uppercase tracking-[0.22em]"
          style={{ color: faintColor }}
        >
          {secondaryLabel}
        </p>
        <span className="font-mono text-2xl font-bold" style={{ color: mutedColor }}>
          {secondaryValue}
        </span>
      </div>
    </div>
  );
};
