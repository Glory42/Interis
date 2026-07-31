import { Link } from "@tanstack/react-router";
import { Film, Tv, type LucideIcon } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { getPosterUrl } from "@/features/films/components/utils";
import type { UserTopPickCategory, UserTopPickItem } from "@/features/profile/api";

export type TopPickCategoryKey = "cinema" | "serial";

const topPickCategoryMeta: Record<
  TopPickCategoryKey,
  { label: string; color: string; icon: LucideIcon; defaultSupported: boolean }
> = {
  cinema: {
    label: "Favorite Cinemas",
    color: "var(--module-cinema)",
    icon: Film,
    defaultSupported: true,
  },
  serial: {
    label: "Favorite Serials",
    color: "var(--module-serial)",
    icon: Tv,
    defaultSupported: true,
  },
};

const resolveTmdbId = (item: UserTopPickItem | null): number | null => {
  if (!item) {
    return null;
  }

  const directTmdbId = item.tmdbId;
  if (Number.isInteger(directTmdbId)) {
    return directTmdbId;
  }

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
    if (!bySlot.has(item.slot)) {
      bySlot.set(item.slot, item);
    }
  }

  return [1, 2, 3, 4].map((slot) => bySlot.get(slot) ?? null);
};

const linkClassName = "block transition-opacity duration-200 hover:opacity-80 animate-fade-up";

const TopPickSlot = ({
  categoryKey,
  item,
  isCategorySupported,
  style,
}: {
  categoryKey: TopPickCategoryKey;
  item: UserTopPickItem | null;
  isCategorySupported: boolean;
  style?: CSSProperties;
}) => {
  const [didPosterFail, setDidPosterFail] = useState(false);
  const meta = topPickCategoryMeta[categoryKey];
  const CategoryIcon = meta.icon;
  const tmdbId = resolveTmdbId(item);
  const title =
    item?.title?.trim() || (isCategorySupported ? "Not set" : "Not supported");
  const posterUrl = item?.posterPath ? getPosterUrl(item.posterPath) : null;
  const showPoster = Boolean(posterUrl && !didPosterFail);

  const body = (
    <div
      className="aspect-[2/3] overflow-hidden rounded-lg border"
      style={{
        borderColor: "var(--profile-shell-row-border)",
        background: "color-mix(in srgb, var(--profile-shell-bg) 85%, black)",
      }}
    >
      {showPoster ? (
        <img
          src={posterUrl ?? undefined}
          alt={title}
          className="h-full w-full object-cover"
          onError={() => {
            setDidPosterFail(true);
          }}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 p-2">
          <CategoryIcon
            className="h-4 w-4"
            style={{ color: meta.color, opacity: 0.4 }}
            aria-hidden="true"
          />
          <p className="line-clamp-2 text-center text-[10px] leading-tight profile-shell-muted">
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
        className={linkClassName}
        style={style}
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
        className={linkClassName}
        style={style}
        viewTransition
      >
        {body}
      </Link>
    );
  }

  return (
    <div className={linkClassName} style={style}>
      {body}
    </div>
  );
};

type ProfileTopPicksRowProps = {
  categoryKey: TopPickCategoryKey;
  category: UserTopPickCategory | undefined;
  isPending: boolean;
  isError: boolean;
};

export const ProfileTopPicksRow = ({
  categoryKey,
  category,
  isPending,
  isError,
}: ProfileTopPicksRowProps) => {
  const meta = topPickCategoryMeta[categoryKey];
  const Icon = meta.icon;
  const slots = toSlotItems(category);
  const isCategorySupported = category?.supported ?? meta.defaultSupported;

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0" style={{ color: meta.color }} aria-hidden="true" />
        <span className="text-sm" style={{ color: meta.color }}>
          {meta.label}
        </span>
      </div>

      {isPending ? (
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((slot) => (
            <Skeleton key={slot} className="aspect-[2/3]" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-xs text-destructive">Could not load top picks.</p>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {slots.map((slotItem, index) => (
            <TopPickSlot
              key={`top-pick-${categoryKey}-${index + 1}`}
              categoryKey={categoryKey}
              item={slotItem}
              isCategorySupported={isCategorySupported}
              style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
