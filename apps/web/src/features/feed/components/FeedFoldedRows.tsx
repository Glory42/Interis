import { Link } from "@tanstack/react-router";
import { episodeCode, episodesSummary, followsVerb, titlesVerb } from "@/features/feed/components/feed-days";
import type { FeedRow, FeedTitleGroup } from "@/features/feed/types";
import { getPosterUrl } from "@/features/media/tmdb-images";

const LINE_CLASS = "flex items-center gap-2 rounded-[3px] border border-[color:var(--line)] px-3 py-2 text-xs";

const ActorLink = ({ username }: { username: string }) => (
  <Link to="/profile/$username" params={{ username }} className="font-semibold text-foreground">
    {username}
  </Link>
);

export const TitlesLine = ({ row }: { row: Extract<FeedRow, { kind: "titles" }> }) => (
  <div className={LINE_CLASS}>
    <ActorLink username={row.actor.username} />
    <span className="shrink-0 text-muted-foreground">{titlesVerb(row)}</span>
    <span className="ml-auto flex min-w-0 items-center gap-1.5">
      {row.titles.slice(0, 3).map((title) => (
        <img key={`${title.mediaType}-${title.tmdbId}`} src={getPosterUrl(title.posterPath)} alt="" className="aspect-2/3 w-[18px] rounded-[1px] object-cover" />
      ))}
      <span className="mono-meta truncate text-muted-foreground">{row.titles.map((title) => title.title).join(", ")}</span>
    </span>
  </div>
);

export const FollowsLine = ({ row }: { row: Extract<FeedRow, { kind: "follows" }> }) => (
  <div className={LINE_CLASS}>
    <ActorLink username={row.actor.username} />
    <span className="shrink-0 text-muted-foreground">{followsVerb(row)}</span>
    <span className="mono-meta ml-auto min-w-0 truncate text-muted-foreground">
      {row.usernames.map((username, index) => (
        <span key={username}>
          {index > 0 ? ", " : null}
          <Link to="/profile/$username" params={{ username }} className="hover:text-foreground hover:underline">
            {`@${username}`}
          </Link>
        </span>
      ))}
    </span>
  </div>
);

// Each season or episode in a folded run: its code, then its rating and like.
export const EpisodeList = ({ groups }: { groups: FeedTitleGroup[] }) => (
  <ul className="mono-meta flex flex-wrap gap-x-3 gap-y-0.5 text-muted-foreground">
    {groups.map((group) => (
      <li key={group.id} className="flex items-center gap-1">
        <span className="text-foreground">{episodeCode(group)}</span>
        {group.rating !== null ? <span>{`${group.rating}/10`}</span> : null}
        {group.liked ? <span aria-label="Liked" className="text-[color:var(--like)]">♥</span> : null}
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
