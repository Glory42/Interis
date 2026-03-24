import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Top4FilmsProps = {
  movieIds: number[];
};

export const Top4Films = ({ movieIds }: Top4FilmsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 4</CardTitle>
      </CardHeader>
      <CardContent>
        {movieIds.length === 0 ? (
          <p className="text-sm text-muted-foreground">Top 4 films not selected yet.</p>
        ) : (
          <ol className="grid gap-2 text-sm text-foreground sm:grid-cols-2">
            {movieIds.slice(0, 4).map((movieId, index) => (
              <li key={movieId} className="rounded-md border border-border/70 bg-secondary/20 px-3 py-2">
                #{index + 1} Movie ID {movieId}
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
};
