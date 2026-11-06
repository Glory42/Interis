import { Link, useRouterState } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useGlobalSearchDialog } from "@/features/search/components/useGlobalSearchDialog";

// The film-leader countdown, with the primary-colour wedge.
const CountdownMark = () => (
  <svg aria-hidden width="116" height="116" viewBox="0 0 120 120" className="shrink-0">
    <circle cx="60" cy="60" r="54" fill="none" stroke="#333" strokeWidth="1.5" />
    <circle cx="60" cy="60" r="42" fill="none" stroke="#333" />
    <path d="M60 0V120M0 60H120" stroke="#2a2a2a" />
    <path d="M60 6A54 54 0 0 1 114 60L60 60Z" fill="var(--primary)" opacity=".2" />
    <text x="60" y="71" textAnchor="middle" fontFamily="var(--theme-display-font)" fontWeight="700" fontSize="34" fill="#eee">
      404
    </text>
  </svg>
);

// "Cut to black." — black in every theme; only the wedge and the button use --primary.
export const NotFoundPage = () => {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { open: openSearch } = useGlobalSearchDialog();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <div className="overflow-hidden rounded-md border border-[#1a1a1a] bg-black text-[#eeeeee]">
        <div className="slate border-b border-[#1a1a1a]">
          <span>Reel 404 · Scene missing</span>
          <span>00:00:00:00</span>
        </div>
        <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
          <div className="duotone-grain pointer-events-none absolute inset-0" />
          <CountdownMark />
          <div className="relative min-w-0">
            <p className="truncate font-mono text-[10.5px] text-[#777777]">{pathname}</p>
            <h1 className="display-1 mt-1 mb-1.5 text-[34px]">Cut to black.</h1>
            <p className="body-s text-[#9a9a9a]">
              That frame isn&apos;t in the reel. The link may be mistyped, or the page may have been cut.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button asChild>
                <Link to="/">Back to home</Link>
              </Button>
              <Button variant="secondary" className="border-[#333333] text-[#dddddd]" onClick={openSearch}>
                Search
                <kbd className="rounded-sm border border-[#333333] px-1 font-mono text-[10px]">⌘K</kbd>
              </Button>
              <Link to="/movies" className="text-xs text-[#dddddd] underline underline-offset-2 sm:ml-1">
                Browse films
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
