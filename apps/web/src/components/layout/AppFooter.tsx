import { Link } from "@tanstack/react-router";

// One slate line: the app, the TMDB credit its terms require, and the outbound links.
export const AppFooter = () => (
  <footer className="slate flex-wrap gap-y-1 px-4">
    <span>Interis · logged, not filtered</span>
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span>
        Film and TV data from{" "}
        <a
          href="https://www.themoviedb.org"
          target="_blank"
          rel="noreferrer"
          className="underline-offset-2 hover:text-white hover:underline"
        >
          TMDB
        </a>
        .
      </span>
      <span>This product uses the TMDB API but is not endorsed or certified by TMDB.</span>
      <Link to="/developer" className="hover:text-white" viewTransition>
        Developer
      </Link>
      <a
        href="https://docs.interis.gorkemkaryol.dev"
        target="_blank"
        rel="noreferrer"
        className="hover:text-white"
      >
        Docs
      </a>
    </span>
  </footer>
);
