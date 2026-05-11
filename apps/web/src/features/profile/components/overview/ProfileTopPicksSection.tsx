import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  Film,
  Music,
  Tv,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { getPosterUrl } from "@/features/films/components/utils";
import type {
  UserTopPickCategory,
  UserTopPickItem,
  UserTopPicks,
} from "@/features/profile/api";

type ProfileTopPicksSectionProps = {
  topPicks: UserTopPicks | null;
  isTopPicksPending: boolean;
  isTopPicksError: boolean;
};

type TopPickCategoryKey = "cinema" | "serial" | "music" | "books";

const topPickCategoryOrder: TopPickCategoryKey[] = [
  "cinema",
  "serial",
  "music",
  "books",
];

const topPickCategoryMeta: Record<
  TopPickCategoryKey,
  {
    label: string;
    color: string;
    icon: LucideIcon;
    defaultSupported: boolean;
  }
> = {
  cinema: {
    label: "Cinema",
    color: "var(--module-cinema)",
    icon: Film,
    defaultSupported: true,
  },
  serial: {
    label: "Serial",
    color: "var(--module-serial)",
    icon: Tv,
    defaultSupported: true,
  },
  music: {
    label: "Music",
    color: "var(--module-music)",
    icon: Music,
    defaultSupported: true,
  },
  books: {
    label: "Books",
    color: "var(--module-book)",
    icon: BookOpen,
    defaultSupported: true,
  },
};

const resolveTmdbId = (item: UserTopPickItem | null): number | null => {
  if (!item) return null;
  const directTmdbId = item.tmdbId;
  if (Number.isInteger(directTmdbId)) return directTmdbId;
  if (item.mediaSource === "tmdb") {
    const parsed = Number(item.mediaSourceId);
    return Number.isInteger(parsed) ? parsed : null;
  }
  return null;
};

const toSlotItems = (
  category: UserTopPickCategory | undefined,
): Array<UserTopPickItem | null> => {
  const bySlot = new Map<number, UserTopPickItem>();
  for (const item of category?.items ?? []) {
    if (!bySlot.has(item.slot)) bySlot.set(item.slot, item);
  }
  return [1, 2, 3, 4].map((slot) => bySlot.get(slot) ?? null);
};

const TopPickSlot = ({
  categoryKey,
  categoryColor,
  categoryIcon: CategoryIcon,
  item,
  isCategorySupported,
}: {
  categoryKey: TopPickCategoryKey;
  categoryColor: string;
  categoryIcon: LucideIcon;
  item: UserTopPickItem | null;
  isCategorySupported: boolean;
}) => {
  const [didPosterFail, setDidPosterFail] = useState(false);
  const tmdbId = resolveTmdbId(item);
  const title =
    item?.title?.trim() ||
    (isCategorySupported ? "Not set" : "Not supported");

  const coverUrl = item
    ? categoryKey === "music" || categoryKey === "books"
      ? (item.coverArtUrl ?? null)
      : item.posterPath
        ? getPosterUrl(item.posterPath)
        : null
    : null;

  const showPoster = Boolean(coverUrl && !didPosterFail);

  const body = (
    <div
      className="relative aspect-[2/3] overflow-hidden border"
      style={{
        borderColor: "var(--profile-shell-row-border)",
        background: "color-mix(in srgb, var(--profile-shell-bg) 85%, black)",
      }}
    >
      {showPoster ? (
        <img
          src={coverUrl ?? undefined}
          alt={title}
          className="h-full w-full object-cover"
          onError={() => { setDidPosterFail(true); }}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center p-1">
          <CategoryIcon
            className="mb-0.5 h-3 w-3"
            style={{ color: categoryColor, opacity: 0.4 }}
            aria-hidden="true"
          />
          <p className="line-clamp-3 text-center font-mono text-[6px] leading-tight profile-shell-muted">
            {title}
          </p>
        </div>
      )}
    </div>
  );

  if (categoryKey === "cinema" && tmdbId !== null) {
    return (
      <Link
        to="/cinema/$tmdbId"
        params={{ tmdbId: String(tmdbId) }}
        className="relative z-0 block transition-transform duration-200 ease-out hover:z-20 hover:-translate-y-1 hover:scale-[1.06] hover:shadow-[0_10px_24px_rgba(0,0,0,0.35)]"
        viewTransition
      >
        {body}
      </Link>
    );
  }

  if (categoryKey === "serial" && tmdbId !== null) {
    return (
      <Link
        to="/serials/$tmdbId"
        params={{ tmdbId: String(tmdbId) }}
        className="relative z-0 block transition-transform duration-200 ease-out hover:z-20 hover:-translate-y-1 hover:scale-[1.06] hover:shadow-[0_10px_24px_rgba(0,0,0,0.35)]"
        viewTransition
      >
        {body}
      </Link>
    );
  }

  if (categoryKey === "music" && item?.mediaSourceId) {
    return (
      <Link
        to="/music/$mbid"
        params={{ mbid: item.mediaSourceId }}
        className="relative z-0 block transition-transform duration-200 ease-out hover:z-20 hover:-translate-y-1 hover:scale-[1.06] hover:shadow-[0_10px_24px_rgba(0,0,0,0.35)]"
        viewTransition
      >
        {body}
      </Link>
    );
  }

  if (categoryKey === "books" && item?.mediaSourceId) {
    return (
      <Link
        to="/books/$volumeId"
        params={{ volumeId: item.mediaSourceId }}
        className="relative z-0 block transition-transform duration-200 ease-out hover:z-20 hover:-translate-y-1 hover:scale-[1.06] hover:shadow-[0_10px_24px_rgba(0,0,0,0.35)]"
        viewTransition
      >
        {body}
      </Link>
    );
  }

  return (
    <div className="relative z-0 transition-transform duration-200 ease-out hover:z-20 hover:-translate-y-1 hover:scale-[1.06] hover:shadow-[0_10px_24px_rgba(0,0,0,0.35)]">
      {body}
    </div>
  );
};

export const ProfileTopPicksSection = ({
  topPicks,
  isTopPicksPending,
  isTopPicksError,
}: ProfileTopPicksSectionProps) => {
  const categoriesByKey = new Map(
    (topPicks?.categories ?? []).map((category) => [category.key, category]),
  );

  return (
    <section className="space-y-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] profile-shell-accent">
        Top Picks
      </p>

      {isTopPicksPending ? (
        <div className="border px-4 py-3 text-sm profile-shell-border profile-shell-muted profile-shell-panel">
          Loading top picks...
        </div>
      ) : null}

      {isTopPicksError ? (
        <div className="border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Could not load top picks.
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {topPickCategoryOrder.map((categoryKey) => {
          const category = categoriesByKey.get(categoryKey);
          const slots = toSlotItems(category);
          const meta = topPickCategoryMeta[categoryKey];
          const Icon = meta.icon;
          const isCategorySupported = category?.supported ?? meta.defaultSupported;

          return (
            <section
              key={`top-pick-category-${categoryKey}`}
              className="relative z-0 border p-4 transition-transform duration-300 ease-out hover:z-10 hover:-translate-y-1 hover:scale-[1.01]"
              style={{
                borderColor: "var(--profile-shell-border)",
                background: "var(--profile-shell-panel)",
              }}
            >
              <div className="mb-3 flex items-center gap-2">
                <Icon
                  className="h-3.5 w-3.5 shrink-0"
                  style={{ color: meta.color }}
                  aria-hidden="true"
                />
                <span
                  className="font-mono text-[9px] uppercase tracking-widest"
                  style={{ color: meta.color }}
                >
                  {meta.label}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {slots.map((slotItem, index) => (
                  <TopPickSlot
                    key={`top-pick-slot-${categoryKey}-${index + 1}`}
                    categoryKey={categoryKey}
                    categoryColor={meta.color}
                    categoryIcon={Icon}
                    item={slotItem}
                    isCategorySupported={isCategorySupported}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
};
