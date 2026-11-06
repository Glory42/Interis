import { Link } from "@tanstack/react-router";

export const AppFooter = () => {
  return (
    <footer className="border-t border-border/70">
      <div className="mx-auto flex w-full max-w-400 flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          INTERIS
        </div>

        <div className="flex flex-col items-center gap-1 text-center">
          <p className="font-mono text-[10px] text-muted-foreground">logged, not filtered.</p>
          <p className="font-mono text-[10px] text-muted-foreground">
            Film and TV data from{" "}
            <a
              href="https://www.themoviedb.org"
              target="_blank"
              rel="noreferrer"
              className="underline-offset-2 hover:text-primary hover:underline"
            >
              TMDB
            </a>
            .
          </p>
          <p className="font-mono text-[10px] text-muted-foreground">
            This product uses the TMDB API but is not endorsed or certified by TMDB.
          </p>
        </div>

        <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          <Link to="/developer" className="hover:text-primary" viewTransition>
            developer
          </Link>
          <a
            href="https://docs.interis.gorkemkaryol.dev"
            target="_blank"
            rel="noreferrer"
            className="hover:text-primary"
          >
            docs
          </a>
        </div>
      </div>
    </footer>
  );
};
