import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getPosterUrl } from "@/features/films/components/utils";
import type { DiaryEntry } from "@/types/api";

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

const toOutOfFiveLabel = (ratingOutOfTen: number): string => {
  return `${(ratingOutOfTen / 2).toFixed(1)}/5`;
};

export const DiaryEntryItem = ({ entry }: DiaryEntryProps) => {
  return (
    <Card className="overflow-hidden">
      <CardContent className="grid gap-4 p-4 sm:grid-cols-[84px_1fr]">
        <img
          src={getPosterUrl(entry.moviePosterPath)}
          alt={`${entry.movieTitle} poster`}
          className="h-[126px] w-[84px]  border border-border/70 object-cover"
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
              Watched {formatDate(entry.watchedDate)} • Logged{" "}
              {formatDate(entry.createdAt)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {entry.rating !== null ? (
              <Badge variant="accent">
                Score: {toOutOfFiveLabel(entry.rating)}
              </Badge>
            ) : null}
            {entry.rewatch ? <Badge variant="primary">Rewatch</Badge> : null}
          </div>

          {entry.reviewContent ? (
            <div className="space-y-1  border border-border/60 bg-secondary/20 p-3">
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
      </CardContent>
    </Card>
  );
};
