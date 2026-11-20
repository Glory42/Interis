import { Link } from "@tanstack/react-router";
import { ArrowRight, ListVideo } from "lucide-react";
import { useUpNext } from "@/features/tv/hooks/useTv";
import { SERIES_MODULE_STYLES } from "@/features/media/styles";

// The TV page's way into Up next, with how many shows have an episode waiting.
export const UpNextButton = () => {
  const count = useUpNext().data?.upNext.length ?? 0;

  return (
    <Link
      to="/serials/up-next"
      aria-label={count > 0 ? `Up next: ${count} ${count === 1 ? "show" : "shows"} waiting` : "Up next"}
      className="group inline-flex h-7 items-center gap-2 self-center rounded-[3px] border px-2.5 text-sm leading-none font-semibold text-foreground transition-colors hover:bg-[color:color-mix(in_srgb,var(--series)_14%,transparent)]"
      style={{ borderColor: SERIES_MODULE_STYLES.accent }}
      viewTransition
    >
      <ListVideo aria-hidden className="size-4" style={{ color: SERIES_MODULE_STYLES.accent }} />
      Up next
      {count > 0 ? (
        <span
          className="mono-meta min-w-4 rounded-[2px] px-1 py-px text-center text-[10px] leading-none"
          style={{ background: SERIES_MODULE_STYLES.accent, color: "var(--bg)" }}
        >
          {count}
        </span>
      ) : null}
      <ArrowRight aria-hidden className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
};
