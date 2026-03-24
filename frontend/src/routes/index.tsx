import { Link, createFileRoute } from "@tanstack/react-router";
import { Film, UserRound } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeedList } from "@/features/feed/components/FeedList";
import { useAuth } from "@/features/auth/hooks/useAuth";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const { user } = useAuth();

  return (
    <PageWrapper>
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card className="overflow-hidden border-border/70">
          <CardContent className="space-y-6 p-6 sm:p-8">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.18em] text-primary">
                Phase 1 Frontend
              </p>
              <h1 className="max-w-xl text-3xl font-bold leading-tight text-foreground sm:text-4xl">
                Log films with a cinematic workflow built for your diary.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                Search TMDB-powered films, open details, and create diary entries tied to
                your real auth session. Social feed, reviews, and interactions are scaffolded
                for the next phase.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/films">
                  <Film className="h-4 w-4" /> Explore films
                </Link>
              </Button>

              {user ? (
                <Button asChild variant="outline">
                  <Link to="/profile/$username" params={{ username: user.username }}>
                    <UserRound className="h-4 w-4" /> My profile
                  </Link>
                </Button>
              ) : (
                <Button asChild variant="outline">
                  <Link to="/register">Create account</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Roadmap status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Backend Phase 1 endpoints are connected to this UI.</p>
            <p>Auth + films + diary logging are implemented.</p>
            <p>Feed/reviews/interactions/lists/admin UI is scaffolded for next phases.</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-foreground">Feed preview area</h2>
        <FeedList />
      </div>
    </PageWrapper>
  );
}
