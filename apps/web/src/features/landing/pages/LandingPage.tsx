import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useTrendingNow } from "@/features/feed/hooks/useFeed";
import { LandingDiarySpecimen } from "@/features/landing/components/LandingDiarySpecimen";
import { LandingHero } from "@/features/landing/components/LandingHero";
import { LandingTrending } from "@/features/landing/components/LandingTrending";
import { useTrendingSeries } from "@/features/serials/hooks/useSerials";

export const LandingPage = () => {
  // Nine matches the loader's prefetch in routes/index.tsx; the grid shows eight.
  const filmsQuery = useTrendingNow(9);
  const showsQuery = useTrendingSeries();
  const films = filmsQuery.data ?? [];
  const shows = showsQuery.data ?? [];

  return (
    <div className="w-full pb-20 sm:pb-0">
      <LandingHero specimen={<LandingDiarySpecimen films={films} />} />
      <LandingTrending films={films} shows={shows} isLoadingFilms={filmsQuery.isPending} isLoadingShows={showsQuery.isPending} />

      {/* Phones keep sign-up within reach while scrolling. */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-[color:var(--line)] bg-background/95 px-4 py-3 backdrop-blur sm:hidden">
        <Button asChild size="md" className="flex-1">
          <Link to="/register">Start your diary, free</Link>
        </Button>
        <Button asChild size="md" variant="outline">
          <Link to="/login">Log in</Link>
        </Button>
      </div>
    </div>
  );
};
