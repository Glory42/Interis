import { Link } from "@tanstack/react-router";

// One centred slate line: the app and its outbound links. The TMDB credit is on the Developer page.
export const AppFooter = () => (
  <footer className="slate flex-wrap justify-center gap-x-3 gap-y-1 px-4">
    <span>Interis · logged, not filtered</span>
    <span aria-hidden>·</span>
    <Link to="/developer" className="hover:text-white" viewTransition>
      Developer
    </Link>
    <span aria-hidden>·</span>
    <a href="https://docs.interis.gorkemkaryol.dev" target="_blank" rel="noreferrer" className="hover:text-white">
      Docs
    </a>
  </footer>
);
