import { Link } from "@tanstack/react-router";
import { Clapperboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/layout/BrandMark";
import { PosterWallBackdrop } from "@/components/layout/PosterWallBackdrop";

type LandingHeroProps = {
  posterPaths: (string | null)[];
};

export const LandingHero = ({ posterPaths }: LandingHeroProps) => {
  return (
    <section className="relative h-[560px] overflow-hidden sm:h-[620px]">
      <PosterWallBackdrop posterPaths={posterPaths} />

      <div className="absolute inset-0 z-10 flex items-center justify-center px-4">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
          <div className="flex items-center gap-2">
            <BrandMark className="h-7 w-7 shrink-0" />
            <span className="font-mono text-lg font-extrabold tracking-widest text-foreground/90">
              Interis
            </span>
          </div>

          <span className="theme-kicker inline-flex items-center gap-1.5 text-[10px] text-primary">
            <Clapperboard className="h-3.5 w-3.5" />
            Your movie &amp; TV journal
          </span>

          <h1 className="theme-display-title text-4xl font-black leading-tight tracking-tight text-foreground sm:text-6xl">
            Every watch, remembered.
          </h1>

          <p className="max-w-lg text-sm text-muted-foreground sm:text-base">
            Log what you watch, rate and review it, and see what the people
            you follow are into. Interis is a movie and TV diary built for
            people who take their watchlist seriously.
          </p>

          <div className="mt-2 flex flex-col items-center gap-3">
            <Button asChild size="lg" className="px-8">
              <Link to="/register" viewTransition>
                Get started, it&apos;s free
              </Link>
            </Button>
            <Link
              to="/login"
              viewTransition
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Already have an account? Log in
            </Link>
          </div>

          <Link
            to="/movies"
            viewTransition
            className="theme-kicker mt-4 text-[10px] text-muted-foreground/70 transition-colors hover:text-foreground"
          >
            Browse the archive without an account →
          </Link>
        </div>
      </div>
    </section>
  );
};
