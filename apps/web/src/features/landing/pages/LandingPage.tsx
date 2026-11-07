import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useTrendingNow } from "@/features/feed/hooks/useFeed";
import { LandingDiarySpecimen } from "@/features/landing/components/LandingDiarySpecimen";
import { LandingHero } from "@/features/landing/components/LandingHero";
import { LandingTrending } from "@/features/landing/components/LandingTrending";
import { useTrendingSeries } from "@/features/serials/hooks/useSerials";

export const LandingPage = () => {
  // Nine matches the loader's prefetch in routes/index.tsx; the grid shows eight.
  const films = useTrendingNow(9).data ?? [];
  const shows = useTrendingSeries().data ?? [];

  return (
    <div className="w-full pb-20 sm:pb-0">
      <LandingHero specimen={<LandingDiarySpecimen films={films} />} />
      <LandingTrending films={films} shows={shows} />

      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="slate mono-meta rounded-[3px] uppercase">
          <span>Interis · logged, not filtered.</span>
          <span className="flex gap-3">
            <Link to="/developer" className="hover:text-white">
              Developer
            </Link>
          </span>
        </div>
      </div>

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
