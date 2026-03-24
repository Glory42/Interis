import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useMovieLogs } from "@/features/films/hooks/useMovies";

type MovieLogsProps = {
  tmdbId: number;
};

const formatDate = (value: string | null): string => {
  if (!value) {
    return "Unknown";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString();
};

export const MovieLogs = ({ tmdbId }: MovieLogsProps) => {
  const logsQuery = useMovieLogs(tmdbId, tmdbId > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Community logs</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {logsQuery.isPending ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner /> Loading logs...
          </p>
        ) : null}

        {logsQuery.isError ? (
          <p className="text-sm text-destructive">Could not load movie logs.</p>
        ) : null}

        {!logsQuery.isPending && !logsQuery.isError && (logsQuery.data?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">
            No one has logged this film yet.
          </p>
        ) : null}

        <div className="space-y-3">
          {logsQuery.data?.map((log) => (
            <div
              key={log.diaryEntryId}
              className="space-y-2 rounded-xl border border-border/70 bg-secondary/20 p-3 sm:p-3.5"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-2">
                  <img
                    src={
                      log.avatarUrl ||
                      "https://placehold.co/80x80/1b2140/cfd7ff?text=User"
                    }
                    alt={`${log.username} avatar`}
                    className="h-8 w-8 rounded-full border border-border object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">@{log.username}</p>
                    <p className="text-xs text-muted-foreground">
                      Watched {formatDate(log.watchedDate)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {log.rating !== null ? <Badge variant="accent">{log.rating}/10</Badge> : null}
                  {log.rewatch ? <Badge variant="primary">Rewatch</Badge> : null}
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Logged on {formatDate(log.createdAt)}
              </p>

              {log.reviewContent ? (
                <div className="space-y-1 rounded-lg bg-background/40 p-2">
                  {log.reviewContainsSpoilers ? (
                    <Badge variant="default">Spoilers</Badge>
                  ) : null}
                  <p className="text-sm text-foreground">{log.reviewContent}</p>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
