import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const LandingHero = ({ specimen }: { specimen: ReactNode }) => (
  <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 pt-10 pb-6 lg:grid-cols-[1fr_26rem] lg:items-center lg:pt-16">
    <div>
      <p className="kicker text-primary">A diary for films and TV</p>
      <h1 className="display-1 mt-2 leading-[0.95] text-foreground">Every watch, remembered.</h1>
      <p className="body mt-4 max-w-xl text-muted-foreground">
        Log what you watch, give it a rocket rating from 1 to 10, track shows one episode at a time, and see what the people you follow are watching.
      </p>
      <div className="mt-6 hidden flex-wrap items-center gap-2 sm:flex">
        <Button asChild size="lg">
          <Link to="/register">Start your diary, free</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/login">Log in</Link>
        </Button>
      </div>
      <Link to="/movies" className="body-s mt-4 inline-block text-foreground underline decoration-[color:var(--line-strong)] underline-offset-4 hover:decoration-[color:var(--primary)]">
        Browse films and TV without an account →
      </Link>
      <p className="mono-meta mt-6 uppercase text-muted-foreground">Diary · Rockets · Reels · Feed</p>
    </div>
    {specimen}
  </section>
);
