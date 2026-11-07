import { Link } from "@tanstack/react-router";

// One slate line: the app and its outbound links. The TMDB credit is on the Developer page.
export const AppFooter = () => (
  <footer className="slate flex-wrap gap-y-1 px-4">
    <span>Interis · logged, not filtered</span>
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
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
