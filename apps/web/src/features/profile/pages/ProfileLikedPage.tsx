import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { getPosterUrl } from "@/features/films/components/utils";
import { ProfileTabEmptyState } from "@/features/profile/components/ProfileTabEmptyState";
import {
  useUserLikedFilms,
  useUserLikedLists,
  useUserLikedReviews,
} from "@/features/profile/hooks/useProfile";
import type { LikedList, LikedReview } from "@/features/profile/api";
import type { UserInteractionMovie } from "@/features/profile/api";
import { getRelativeTime } from "@/features/profile/utils/profile.utils";
import { formatRelativeTime } from "@/lib/time";

type LikedTab = "medias" | "reviews" | "lists";
type MediaFilter = "all" | "cinema" | "serial";
type ListFilter = "all" | "cinema" | "serial" | "mixed";

const topTabs: Array<{ key: LikedTab; label: string }> = [
  { key: "medias", label: "Medias" },
  { key: "reviews", label: "Reviews" },
  { key: "lists", label: "Lists" },
];

const mediaSubFilters: Array<{ key: MediaFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "cinema", label: "Cinema" },
  { key: "serial", label: "Serial" },
];

const listSubFilters: Array<{ key: ListFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "cinema", label: "Cinema" },
  { key: "serial", label: "Serial" },
  { key: "mixed", label: "Mixed" },
];

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";
const getSmallPosterUrl = (posterPath: string | null) =>
  posterPath ? `${TMDB_IMAGE_BASE}/w92${posterPath}` : "";

const OFFSET = 40;
const POSTER_W = 48;
const POSTER_H = 70;
const CONTAINER_W = POSTER_W + OFFSET * 3;

const tabButtonStyle = (isActive: boolean): React.CSSProperties =>
  isActive
    ? {
        borderColor: "var(--profile-shell-accent)",
        color: "var(--profile-shell-accent)",
        background: "color-mix(in srgb, var(--profile-shell-accent) 8%, transparent)",
      }
    : {
        borderColor: "var(--profile-shell-border)",
        color: "var(--profile-shell-muted)",
        background: "transparent",
      };

// ── Media grid (inlined to share the sub-filter row with top tabs) ──────────
const routeByMediaType: Record<string, "/cinema/$tmdbId" | "/serials/$tmdbId" | null> = {
  movie: "/cinema/$tmdbId",
  tv: "/serials/$tmdbId",
};

const MediaGrid = ({
  items,
  filter,
}: {
  items: UserInteractionMovie[];
  filter: MediaFilter;
}) => {
  const filtered = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "cinema") return items.filter((i) => i.mediaType === "movie");
    return items.filter((i) => i.mediaType === "tv");
  }, [items, filter]);

  if (filtered.length === 0) {
    return (
      <div className="border px-3 py-2 text-xs profile-shell-border profile-shell-muted profile-shell-panel">
        No {filter === "all" ? "items" : filter} liked yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-5 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      {filtered.map((item) => {
        const mediaRoute = routeByMediaType[item.mediaType];
        const card = (
          <>
            <div className="relative mb-1.5 aspect-2/3 overflow-hidden border border-border/70 bg-card/25">
              <img
                src={getPosterUrl(item.posterPath)}
                alt={item.title}
                className="h-full w-full object-cover opacity-90 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
                loading="lazy"
              />
            </div>
            <p className="line-clamp-1 text-[11px] font-semibold text-foreground/95 transition-colors group-hover:text-primary">
              {item.title}
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground/85">
              {item.releaseYear ?? "Unknown year"} · liked {getRelativeTime(item.lastInteractionAt)}
            </p>
          </>
        );

        if (mediaRoute) {
          return (
            <Link
              key={`media-${item.mediaType}-${item.tmdbId}`}
              to={mediaRoute}
              params={{ tmdbId: String(item.tmdbId) }}
              className="group block"
              viewTransition
            >
              {card}
            </Link>
          );
        }

        return (
          <div key={`media-${item.mediaType}-${item.tmdbId}`} className="group block">
            {card}
          </div>
        );
      })}
    </div>
  );
};

// ── Liked list card ──────────────────────────────────────────────────────────
const LikedListCard = ({ list }: { list: LikedList }) => {
  const covers = list.coverImages.slice(0, 4);
  const derivedTypeLabel =
    list.derivedType === "cinema"
      ? "CINEMA"
      : list.derivedType === "serial"
        ? "SERIAL"
        : list.derivedType === "mixed"
          ? "MIXED"
          : null;

  return (
    <Link
      to="/profile/$username/lists/$listId"
      params={{ username: list.ownerUsername, listId: list.id }}
      className="group flex items-center gap-5 border-b border-border/50 py-5 transition-opacity last:border-0 hover:opacity-90"
    >
      <div
        className="relative shrink-0"
        style={{ width: `${CONTAINER_W}px`, height: `${POSTER_H}px` }}
      >
        {Array.from({ length: 4 }).map((_, i) => {
          const cover = covers[i];
          const posterUrl = cover ? getSmallPosterUrl(cover.posterPath) : "";
          return (
            <div
              key={i}
              className="absolute top-0 overflow-hidden border border-border/40 bg-muted/20"
              style={{
                left: `${i * OFFSET}px`,
                width: `${POSTER_W}px`,
                height: `${POSTER_H}px`,
                zIndex: 4 - i,
                boxShadow: i > 0 ? "-2px 0 4px rgba(0,0,0,0.25)" : undefined,
              }}
            >
              {posterUrl ? (
                <img src={posterUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="min-w-0 flex-1">
        <p className="mb-0.5 font-mono text-[10px] text-muted-foreground">
          by{" "}
          <span className="profile-shell-accent">
            {list.ownerDisplayUsername ?? list.ownerUsername}
          </span>
        </p>
        <h3 className="mb-1 font-mono text-base font-semibold text-foreground group-hover:text-foreground/90">
          {list.title}
        </h3>
        {list.description ? (
          <p className="mb-2 line-clamp-1 font-mono text-xs text-muted-foreground">
            {list.description}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] font-semibold profile-shell-accent">
            {list.itemCount}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">items</span>
          <span className="font-mono text-[11px] text-muted-foreground">·</span>
          <span className="font-mono text-[11px] text-muted-foreground">
            liked {formatRelativeTime(list.likedAt)}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5 pt-0.5">
        {derivedTypeLabel ? (
          <span className="border border-border/60 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
            {derivedTypeLabel}
          </span>
        ) : null}
        {list.isRanked ? (
          <span className="border border-border/60 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
            RANKED
          </span>
        ) : null}
      </div>
    </Link>
  );
};

// ── Liked review card ────────────────────────────────────────────────────────
const LikedReviewCard = ({ review }: { review: LikedReview }) => {
  const route = review.mediaType === "movie" ? "/cinema/$tmdbId" : "/serials/$tmdbId";
  const tmdbId = review.mediaTmdbId;

  return (
    <div className="border-b border-border/50 py-4 last:border-0">
      <div className="flex gap-3">
        {tmdbId ? (
          <Link to={route} params={{ tmdbId: String(tmdbId) }} className="shrink-0">
            <div className="h-16 w-11 overflow-hidden border border-border/50 bg-card/30">
              {review.mediaPosterPath ? (
                <img
                  src={getPosterUrl(review.mediaPosterPath)}
                  alt={review.mediaTitle ?? ""}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : null}
            </div>
          </Link>
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            {review.mediaTitle ? (
              tmdbId ? (
                <Link
                  to={route}
                  params={{ tmdbId: String(tmdbId) }}
                  className="font-mono text-xs font-semibold text-foreground/90 hover:text-foreground"
                >
                  {review.mediaTitle}
                </Link>
              ) : (
                <span className="font-mono text-xs font-semibold text-foreground/90">
                  {review.mediaTitle}
                </span>
              )
            ) : null}
            {review.mediaReleaseYear ? (
              <span className="font-mono text-[10px] text-muted-foreground">
                {review.mediaReleaseYear}
              </span>
            ) : null}
          </div>

          <p className="mb-2 line-clamp-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
            {review.content}
          </p>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-muted-foreground">
              by{" "}
              <Link
                to="/profile/$username"
                params={{ username: review.reviewerUsername }}
                className="profile-shell-accent hover:underline"
              >
                {review.reviewerDisplayUsername ?? review.reviewerUsername}
              </Link>
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">·</span>
            <span className="font-mono text-[10px] text-muted-foreground">
              liked {formatRelativeTime(review.likedAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Page ─────────────────────────────────────────────────────────────────────
type ProfileLikedPageProps = {
  username: string;
};

export const ProfileLikedPage = ({ username }: ProfileLikedPageProps) => {
  const [activeTab, setActiveTab] = useState<LikedTab>("medias");
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>("all");
  const [reviewFilter, setReviewFilter] = useState<MediaFilter>("all");
  const [listFilter, setListFilter] = useState<ListFilter>("all");

  const mediasQuery = useUserLikedFilms(username);
  const reviewsQuery = useUserLikedReviews(username);
  const listsQuery = useUserLikedLists(username);

  const mediaItems = mediasQuery.data ?? [];
  const reviewItems = reviewsQuery.data ?? [];
  const listItems = listsQuery.data ?? [];

  const filteredReviews = useMemo(() => {
    if (reviewFilter === "all") return reviewItems;
    if (reviewFilter === "cinema") return reviewItems.filter((r) => r.mediaType === "movie");
    return reviewItems.filter((r) => r.mediaType === "tv");
  }, [reviewItems, reviewFilter]);

  const filteredLists = useMemo(() => {
    if (listFilter === "all") return listItems;
    if (listFilter === "mixed") return listItems.filter((l) => !l.derivedType || l.derivedType === "mixed");
    return listItems.filter((l) => l.derivedType === listFilter);
  }, [listItems, listFilter]);

  const countByTab: Record<LikedTab, number | undefined> = {
    medias: mediasQuery.isPending ? undefined : mediaItems.length,
    reviews: reviewsQuery.isPending ? undefined : reviewItems.length,
    lists: listsQuery.isPending ? undefined : listItems.length,
  };

  const activeSubFilters =
    activeTab === "medias"
      ? { filters: mediaSubFilters, active: mediaFilter, onChange: setMediaFilter as (k: string) => void }
      : activeTab === "reviews"
        ? { filters: mediaSubFilters, active: reviewFilter, onChange: setReviewFilter as (k: string) => void }
        : { filters: listSubFilters, active: listFilter, onChange: setListFilter as (k: string) => void };

  return (
    <div>
      {/* Heading */}
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        Likes
        {countByTab[activeTab] !== undefined ? (
          <span className="ml-1 profile-shell-accent">({countByTab[activeTab]})</span>
        ) : null}
      </p>

      {/* Single row: sub-filters left, top tabs right */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-1">
        <div className="flex flex-wrap items-center gap-1">
          {topTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className="border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest transition-colors"
              style={tabButtonStyle(activeTab === tab.key)}
              onClick={() => { setActiveTab(tab.key); }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {activeSubFilters.filters.map((f) => (
            <button
              key={f.key}
              type="button"
              className="border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest transition-colors"
              style={tabButtonStyle(activeSubFilters.active === f.key)}
              onClick={() => { activeSubFilters.onChange(f.key); }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {activeTab === "medias" ? (
        <>
          {mediasQuery.isPending ? (
            <div className="border border-border/60 bg-card/30 p-4 text-sm text-muted-foreground">
              Loading liked media...
            </div>
          ) : mediasQuery.isError ? (
            <div className="border border-border/60 bg-card/30 p-4 text-sm text-destructive">
              Could not load liked media.
            </div>
          ) : mediaItems.length === 0 ? (
            <ProfileTabEmptyState
              icon={Heart}
              title="No liked media yet"
              description="This profile has not liked any films or series yet."
            />
          ) : (
            <MediaGrid items={mediaItems} filter={mediaFilter} />
          )}
        </>
      ) : null}

      {activeTab === "reviews" ? (
        <>
          {reviewsQuery.isPending ? (
            <div className="border border-border/60 bg-card/30 p-4 text-sm text-muted-foreground">
              Loading liked reviews...
            </div>
          ) : reviewsQuery.isError ? (
            <div className="border border-border/60 bg-card/30 p-4 text-sm text-destructive">
              Could not load liked reviews.
            </div>
          ) : reviewItems.length === 0 ? (
            <ProfileTabEmptyState
              icon={Heart}
              title="No liked reviews yet"
              description="This profile has not liked any reviews yet."
            />
          ) : filteredReviews.length === 0 ? (
            <div className="border px-3 py-2 text-xs profile-shell-border profile-shell-muted profile-shell-panel">
              No {reviewFilter === "all" ? "reviews" : reviewFilter} liked yet.
            </div>
          ) : (
            <div>
              {filteredReviews.map((review) => (
                <LikedReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}
        </>
      ) : null}

      {activeTab === "lists" ? (
        <>
          {listsQuery.isPending ? (
            <div className="border border-border/60 bg-card/30 p-4 text-sm text-muted-foreground">
              Loading liked lists...
            </div>
          ) : listsQuery.isError ? (
            <div className="border border-border/60 bg-card/30 p-4 text-sm text-destructive">
              Could not load liked lists.
            </div>
          ) : listItems.length === 0 ? (
            <ProfileTabEmptyState
              icon={Heart}
              title="No liked lists yet"
              description="This profile has not liked any lists yet."
            />
          ) : filteredLists.length === 0 ? (
            <div className="border px-3 py-2 text-xs profile-shell-border profile-shell-muted profile-shell-panel">
              No {listFilter === "all" ? "lists" : listFilter} liked yet.
            </div>
          ) : (
            <div>
              {filteredLists.map((list) => (
                <LikedListCard key={list.id} list={list} />
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
};
