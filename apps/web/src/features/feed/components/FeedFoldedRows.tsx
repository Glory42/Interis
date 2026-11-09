import { memo, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { FeedFoldedNames, type FoldedName } from "@/features/feed/components/FeedFoldedNames";
import { episodeCode, episodesSummary, followsVerb, titleRoute, titlesVerb } from "@/features/feed/components/feed-days";
import type { FeedRow, FeedTitleGroup } from "@/features/feed/types";
import { getPosterUrl } from "@/features/media/tmdb-images";
import { LikeMark } from "@/components/ui/LikeMark";
import { cn } from "@/lib/utils";

type TitlesRow = Extract<FeedRow, { kind: "titles" }>;
type FollowsRow = Extract<FeedRow, { kind: "follows" }>;
type FoldedTitle = TitlesRow["titles"][number];
// "card" is the Following Feed's bordered line, "compact" the profile overview's plain one.
type FoldedVariant = "card" | "compact";

const LINE_CLASS = "rounded-[3px] border border-[color:var(--line)] px-3 py-2 text-xs";

const ActorLink = ({ username }: { username: string }) => (
  <Link to="/profile/$username" params={{ username }} className="user-text min-w-0 font-semibold text-foreground">
    {username}
  </Link>
);

// The names list carries the accessible links; posters are a pointer shortcut to the same pages.
const FoldedPosterLink = memo(function FoldedPosterLink({ title, className }: { title: FoldedTitle; className: string }) {
  return (
    <Link to={titleRoute(title.mediaType)} params={{ tmdbId: String(title.tmdbId) }} tabIndex={-1} aria-hidden title={title.title} className="block shrink-0">
      <img src={getPosterUrl(title.posterPath)} alt="" className={cn("aspect-2/3 object-cover", className)} loading="lazy" />
    </Link>
  );
});

const titleNames = (titles: FoldedTitle[]): FoldedName[] =>
  titles.map((title) => ({
    key: `${title.mediaType}-${title.tmdbId}`,
    node: (
      <Link to={titleRoute(title.mediaType)} params={{ tmdbId: String(title.tmdbId) }} className="hover:text-foreground hover:underline">
        {title.title}
      </Link>
    ),
  }));

const userNames = (usernames: string[]): FoldedName[] =>
  usernames.map((username) => ({
    key: username,
    node: (
      <Link to="/profile/$username" params={{ username }} className="hover:text-foreground hover:underline">
        {`@${username}`}
      </Link>
    ),
  }));

const capitalize = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;

// A run of liked or watchlisted titles: a few tiny posters and the names, all of them a click away.
export const TitlesLine = ({ row, variant = "card" }: { row: TitlesRow; variant?: FoldedVariant }) => {
  const [expanded, setExpanded] = useState(false);
  const names = useMemo(() => titleNames(row.titles), [row.titles]);
  const isCard = variant === "card";
  return (
    <div className={isCard ? LINE_CLASS : "body-s text-muted-foreground"}>
      <div className={cn("flex flex-wrap gap-x-2 gap-y-1", isCard ? "items-center" : "items-baseline")}>
        {isCard ? <ActorLink username={row.actor.username} /> : null}
        <span className="shrink-0 text-muted-foreground">{isCard ? titlesVerb(row) : `${capitalize(titlesVerb(row))} ·`}</span>
        <div className="flex min-w-0 flex-1 basis-40 items-center gap-1.5">
          {!expanded
            ? row.titles.slice(0, 3).map((title) => (
                <FoldedPosterLink key={`${title.mediaType}-${title.tmdbId}`} title={title} className="w-[18px] rounded-[1px]" />
              ))
            : null}
          <FeedFoldedNames
            names={names}
            expanded={expanded}
            onToggle={() => setExpanded((open) => !open)}
            className={cn("flex-1", isCard ? "mono-meta text-muted-foreground" : "text-foreground")}
          />
        </div>
      </div>
      {expanded ? (
        <div aria-hidden className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(52px,1fr))] gap-2 sm:grid-cols-[repeat(auto-fill,minmax(60px,1fr))]">
          {row.titles.map((title) => (
            <FoldedPosterLink key={`${title.mediaType}-${title.tmdbId}`} title={title} className="w-full rounded-[2px] border border-[color:var(--line)]" />
          ))}
        </div>
      ) : null}
    </div>
  );
};

// A run of follows: the people, each linking to their profile.
export const FollowsLine = ({ row, variant = "card" }: { row: FollowsRow; variant?: FoldedVariant }) => {
  const [expanded, setExpanded] = useState(false);
  const names = useMemo(() => userNames(row.usernames), [row.usernames]);
  const isCard = variant === "card";
  return (
    <div className={cn("flex flex-wrap gap-x-2 gap-y-1", isCard ? `${LINE_CLASS} items-center` : "body-s items-baseline text-muted-foreground")}>
      {isCard ? <ActorLink username={row.actor.username} /> : null}
      <span className="shrink-0 text-muted-foreground">{isCard ? followsVerb(row) : `${capitalize(followsVerb(row))} ·`}</span>
      <FeedFoldedNames
        names={names}
        expanded={expanded}
        onToggle={() => setExpanded((open) => !open)}
        className={cn("flex-1 basis-40", isCard ? "mono-meta text-muted-foreground" : "text-foreground")}
      />
    </div>
  );
};

// Each season or episode in a folded run: its code, then its rating and like.
export const EpisodeList = ({ groups }: { groups: FeedTitleGroup[] }) => (
  <ul className="mono-meta flex flex-wrap gap-x-3 gap-y-0.5 text-muted-foreground">
    {groups.map((group) => (
      <li key={group.id} className="flex items-center gap-1">
        <span className="text-foreground">{episodeCode(group)}</span>
        {group.rating !== null ? <span>{`${group.rating}/10`}</span> : null}
        {group.liked ? <LikeMark /> : null}
      </li>
    ))}
  </ul>
);

// One show's seasons and episodes from one day, as a single card.
export const EpisodesCard = ({ row }: { row: Extract<FeedRow, { kind: "episodes" }> }) => (
  <article className="flex items-start gap-3 rounded-[3px] border border-[color:var(--line)] bg-card p-3">
    <img
      src={getPosterUrl(row.movie.posterPath)}
      alt=""
      className="aspect-2/3 w-[62px] shrink-0 rounded-[2px] border border-[color:var(--line)] object-cover"
      loading="lazy"
    />
    <div className="min-w-0 flex-1">
      <p className="flex items-baseline gap-1.5 text-xs">
        <ActorLink username={row.actor.username} />
        <span className="text-muted-foreground">{episodesSummary(row.groups)}</span>
      </p>
      <Link
        to="/serials/$tmdbId"
        params={{ tmdbId: String(row.movie.tmdbId) }}
        className="display-4 mt-0.5 block text-foreground hover:underline"
      >
        {row.movie.title}
        {row.movie.releaseYear ? <span className="mono-meta ml-1.5 font-normal text-muted-foreground">{row.movie.releaseYear}</span> : null}
      </Link>
      <div className="mt-1">
        <EpisodeList groups={row.groups} />
      </div>
    </div>
  </article>
);
