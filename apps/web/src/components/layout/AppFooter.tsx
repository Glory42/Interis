import { Link } from "@tanstack/react-router";

// A slate strip on the navbar's grid: Interis left, the motto centred, links right.
export const AppFooter = () => (
  <footer className="slate px-0">
    <div className="mx-auto grid w-full max-w-400 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-4">
      <span className="truncate">Interis</span>
      <span className="text-center">Logged, not filtered</span>
      <span className="flex items-center justify-end gap-1.5">
        <Link to="/developer" className="hover:text-white" viewTransition>
          Developer
        </Link>
        <span aria-hidden>·</span>
        <a href="https://docs.interis.gorkemkaryol.dev" target="_blank" rel="noreferrer" className="hover:text-white">
          Docs
        </a>
      </span>
    </div>
  </footer>
);
