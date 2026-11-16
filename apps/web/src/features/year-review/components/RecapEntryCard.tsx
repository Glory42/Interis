import { Link } from "@tanstack/react-router";
import { Slate } from "@/components/film/Slate";
import { recapYearFor } from "@/features/year-review/year-review-model";

type RecapEntryCardProps = { username: string; now?: Date };

// The owner's way into their recap from Stats and the profile overview.
export const RecapEntryCard = ({ username, now: nowProp }: RecapEntryCardProps) => {
  const now = nowProp ?? new Date();
  const year = recapYearFor(now);
  const isPartialYear = year === now.getFullYear();

  return (
    <Link
      to="/profile/$username/year/$year"
      params={{ username, year: String(year) }}
      className="group block overflow-hidden rounded-[3px] border border-[color:var(--line)] transition-colors hover:border-[color:var(--line-strong)]"
    >
      <Slate left={["Year in review"]} right={[isPartialYear ? "So far" : "Full year"]} />
      <div className="flex items-end justify-between gap-4 p-4">
        <div className="min-w-0">
          <p className="font-display text-2xl leading-tight font-bold tracking-tight text-foreground sm:text-3xl">
            {`Your ${year} in review`}
          </p>
          <p className="body-s mt-1 text-muted-foreground">Films, hours, streaks, favourites and a card to share.</p>
        </div>
        <span aria-hidden className="mono-meta shrink-0 text-[11px] text-primary uppercase group-hover:underline">
          Open →
        </span>
      </div>
    </Link>
  );
};
