import { Badge } from "@/components/ui/badge";
import { formatDateOnlyLabel } from "@/lib/time";
import { formatRatingLabel } from "@/lib/rating";
import type { DiaryEntry } from "@/types/api";
import { getPosterUrl } from "@/features/media/tmdb-images";

type DiaryEntryProps = {
  entry: DiaryEntry;
};

const formatDate = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString();
};

// watchedDate is a date-only value ("YYYY-MM-DD") with no timezone, unlike
// createdAt/reviewCreatedAt above which are full instants - formatDateOnlyLabel
// parses it as local midnight so it doesn't shift a day for viewers west of
// UTC. Empty options match formatDate's bare toLocaleDateString() output.
const formatWatchedDate = (value: string): string => formatDateOnlyLabel(value, {});


export const DiaryEntryItem = ({ entry }: DiaryEntryProps) => {
  return (
    <div className="surface overflow-hidden">
      <div className="grid gap-4 p-4 sm:grid-cols-[84px_1fr]">
        <img
          src={getPosterUrl(entry.moviePosterPath)}
          alt={`${entry.movieTitle} poster`}
          className="h-31.5 w-21 rounded-lg border border-border/70 object-cover"
          loading="lazy"
        />

        <div className="space-y-2">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">
              {entry.movieTitle}
              {entry.movieReleaseYear ? (
                <span className="ml-2 text-sm font-medium text-muted-foreground">
                  ({entry.movieReleaseYear})
                </span>
              ) : null}
            </h3>
            <p className="text-xs text-muted-foreground">
              Watched {formatWatchedDate(entry.watchedDate)} • Logged{" "}
              {formatDate(entry.createdAt)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {entry.rating !== null ? (
              <Badge variant="accent">
                Score: {formatRatingLabel(entry.rating) ?? ""}
              </Badge>
            ) : null}
            {entry.rewatch ? <Badge variant="primary">Rewatch</Badge> : null}
          </div>

          {entry.reviewContent ? (
            <div className="space-y-1 rounded-lg border border-border/60 bg-secondary/20 p-3">
              {entry.reviewContainsSpoilers ? <Badge>Spoilers</Badge> : null}
              <p className="text-sm text-foreground">{entry.reviewContent}</p>
              {entry.reviewCreatedAt ? (
                <p className="text-xs text-muted-foreground">
                  Review created on {formatDate(entry.reviewCreatedAt)}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
