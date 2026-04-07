import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ExternalLink, Film, Tv } from "lucide-react";
import { usePersonDetail } from "@/features/people/hooks/usePeople";
import { getPersonModuleStyles } from "@/features/people/components/styles";
import type { PersonRouteRole } from "@/features/people/shared";
import { formatDateLabel } from "@/lib/time";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

type PersonDetailPageProps = {
  role: PersonRouteRole;
  slug: string;
};

type CreditMediaTab = "combined" | "movies" | "tv";
type CreditRoleTab = "cast" | "crew";

const getProfileImageUrl = (profilePath: string | null): string => {
  if (!profilePath) {
    return "https://placehold.co/500x750/151931/cfd7ff?text=No+Profile";
  }

  return `${TMDB_IMAGE_BASE}/w500${profilePath}`;
};

const getCreditPosterUrl = (posterPath: string | null): string => {
  if (!posterPath) {
    return "https://placehold.co/300x450/1f1b2b/e8e3f7?text=No+Poster";
  }

  return `${TMDB_IMAGE_BASE}/w342${posterPath}`;
};

const toDisplayDate = (isoDate: string | null): string | null => {
  if (!isoDate) {
    return null;
  }

  return formatDateLabel(isoDate);
};

const mediaTabLabelMap: Record<CreditMediaTab, string> = {
  combined: "Combined",
  movies: "Movies",
  tv: "TV",
};

const roleTabLabelMap: Record<CreditRoleTab, string> = {
  cast: "Cast",
  crew: "Crew",
};

export const PersonDetailPage = ({ role, slug }: PersonDetailPageProps) => {
  const isValidSlug = slug.trim().length > 0;
  const styles = getPersonModuleStyles(role);

  const [mediaTab, setMediaTab] = useState<CreditMediaTab>("combined");
  const [roleTab, setRoleTab] = useState<CreditRoleTab>(
    role === "director" ? "crew" : "cast",
  );

  const detailQuery = usePersonDetail(role, slug, isValidSlug);

  if (!isValidSlug) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <div
          className="border p-5 font-mono text-xs"
          style={{
            borderColor: styles.border,
            background: styles.panel,
            color: styles.muted,
          }}
        >
          Invalid person slug.
        </div>
      </main>
    );
  }

  if (detailQuery.isPending) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <div
          className="h-64 animate-pulse border"
          style={{ borderColor: styles.border, background: styles.panel }}
        />
      </main>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <div
          className="border p-5 font-mono text-xs"
          style={{
            borderColor: styles.border,
            background: styles.panel,
            color: styles.muted,
          }}
        >
          Could not load this person right now.
        </div>
      </main>
    );
  }

  const detail = detailQuery.data;
  const person = detail.person;
  const selectedCredits = detail.credits[mediaTab][roleTab];

  const totalByMediaTab: Record<CreditMediaTab, number> = {
    combined:
      detail.credits.combined.cast.length + detail.credits.combined.crew.length,
    movies:
      detail.credits.movies.cast.length + detail.credits.movies.crew.length,
    tv: detail.credits.tv.cast.length + detail.credits.tv.crew.length,
  };

  const totalByRoleTab: Record<CreditRoleTab, number> = {
    cast: detail.credits[mediaTab].cast.length,
    crew: detail.credits[mediaTab].crew.length,
  };

  const externalLinks = [
    person.externalIds.imdbId
      ? {
          label: "IMDb",
          href: `https://www.imdb.com/name/${person.externalIds.imdbId}`,
        }
      : null,
    person.externalIds.instagramId
      ? {
          label: "Instagram",
          href: `https://www.instagram.com/${person.externalIds.instagramId}`,
        }
      : null,
    person.externalIds.twitterId
      ? { label: "X", href: `https://x.com/${person.externalIds.twitterId}` }
      : null,
    person.externalIds.facebookId
      ? {
          label: "Facebook",
          href: `https://www.facebook.com/${person.externalIds.facebookId}`,
        }
      : null,
    person.externalIds.youtubeId
      ? {
          label: "YouTube",
          href: `https://www.youtube.com/${person.externalIds.youtubeId}`,
        }
      : null,
    person.homepage ? { label: "Homepage", href: person.homepage } : null,
  ].filter((link): link is { label: string; href: string } => link !== null);

  return (
    <div className="min-h-screen">
      <div
        className="sticky top-12 z-20 flex items-center gap-3 border-b px-4 py-3"
        style={{
          background:
            "color-mix(in srgb, var(--card) 94%, var(--background) 6%)",
          borderColor: styles.border,
          backdropFilter: "blur(12px)",
        }}
      >
        <Link
          to={role === "director" ? "/serials" : "/cinema"}
          className="font-mono text-[11px]"
          style={{ color: styles.muted }}
          viewTransition
        >
          {role === "director" ? "Directors" : "Actors"}
        </Link>
        <span className="font-mono text-[11px]" style={{ color: styles.faint }}>
          /
        </span>
        <span
          className="truncate font-mono text-[11px] uppercase"
          style={{ color: styles.accent }}
        >
          {person.name}
        </span>
      </div>

      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[220px_1fr]">
          <aside>
            <div
              className="mb-4 aspect-2/3 overflow-hidden border"
              style={{ borderColor: styles.border }}
            >
              <img
                src={getProfileImageUrl(person.profilePath)}
                alt={`${person.name} profile`}
                className="h-full w-full object-cover"
              />
            </div>

            <div
              className="space-y-2 border p-3"
              style={{ borderColor: styles.border, background: styles.panel }}
            >
              <p
                className="font-mono text-[9px] uppercase tracking-[0.22em]"
                style={{ color: styles.faint }}
              >
                Person
              </p>
              <p className="font-mono text-xs" style={{ color: styles.text }}>
                TMDB ID: {person.tmdbPersonId}
              </p>
              {person.knownForDepartment ? (
                <p
                  className="font-mono text-[11px]"
                  style={{ color: styles.muted }}
                >
                  Known for {person.knownForDepartment}
                </p>
              ) : null}
              {person.popularity !== null ? (
                <p
                  className="font-mono text-[11px]"
                  style={{ color: styles.muted }}
                >
                  Popularity {person.popularity.toFixed(1)}
                </p>
              ) : null}
            </div>

            {externalLinks.length > 0 ? (
              <div
                className="mt-3 space-y-2 border p-3"
                style={{ borderColor: styles.border, background: styles.panel }}
              >
                <p
                  className="font-mono text-[9px] uppercase tracking-[0.22em]"
                  style={{ color: styles.faint }}
                >
                  Links
                </p>
                {externalLinks.map((externalLink) => (
                  <a
                    key={`${person.tmdbPersonId}-${externalLink.label}`}
                    href={externalLink.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-mono text-[11px]"
                    style={{ color: styles.accent }}
                  >
                    <span>{externalLink.label}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ))}
              </div>
            ) : null}
          </aside>

          <section>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              {person.roleHints.map((roleHint) => (
                <span
                  key={`${person.tmdbPersonId}-${roleHint}`}
                  className="border px-2 py-0.5 font-mono text-[9px] uppercase"
                  style={{
                    borderColor: styles.border,
                    color: styles.muted,
                  }}
                >
                  {roleHint}
                </span>
              ))}
            </div>

            <h1
              className="mb-3 font-mono text-3xl font-bold leading-tight md:text-5xl"
              style={{ color: styles.text }}
            >
              {person.name}
            </h1>

            <div
              className="mb-8 grid grid-cols-1 gap-3 border-b pb-6 sm:grid-cols-2"
              style={{ borderColor: styles.borderSoft }}
            >
              <p
                className="font-mono text-[11px]"
                style={{ color: styles.muted }}
              >
                <span style={{ color: styles.faint }}>Born </span>
                {toDisplayDate(person.birthday) ?? "Unknown"}
              </p>
              <p
                className="font-mono text-[11px]"
                style={{ color: styles.muted }}
              >
                <span style={{ color: styles.faint }}>Died </span>
                {toDisplayDate(person.deathday) ?? "-"}
              </p>
              <p
                className="font-mono text-[11px]"
                style={{ color: styles.muted }}
              >
                <span style={{ color: styles.faint }}>Place </span>
                {person.placeOfBirth ?? "Unknown"}
              </p>
              <p
                className="font-mono text-[11px]"
                style={{ color: styles.muted }}
              >
                <span style={{ color: styles.faint }}>Aliases </span>
                {person.alsoKnownAs.length > 0
                  ? person.alsoKnownAs.length
                  : "-"}
              </p>
            </div>

            <p className="mb-8 text-sm leading-relaxed">
              {person.biography ??
                "No biography is available from TMDB for this person."}
            </p>

            <div className="mb-4 flex flex-wrap gap-2">
              {(Object.keys(mediaTabLabelMap) as CreditMediaTab[]).map(
                (tab) => (
                  <button
                    key={`person-media-tab-${tab}`}
                    type="button"
                    className="border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em]"
                    style={{
                      borderColor:
                        mediaTab === tab ? styles.accent : styles.borderSoft,
                      color: mediaTab === tab ? styles.accent : styles.faint,
                      background:
                        mediaTab === tab
                          ? `color-mix(in srgb, ${styles.accent} 10%, transparent)`
                          : "transparent",
                    }}
                    onClick={() => setMediaTab(tab)}
                  >
                    {mediaTabLabelMap[tab]} ({totalByMediaTab[tab]})
                  </button>
                ),
              )}
            </div>

            <div className="mb-6 flex flex-wrap gap-2">
              {(Object.keys(roleTabLabelMap) as CreditRoleTab[]).map((tab) => (
                <button
                  key={`person-role-tab-${tab}`}
                  type="button"
                  className="border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em]"
                  style={{
                    borderColor:
                      roleTab === tab ? styles.accent : styles.borderSoft,
                    color: roleTab === tab ? styles.accent : styles.faint,
                    background:
                      roleTab === tab
                        ? `color-mix(in srgb, ${styles.accent} 10%, transparent)`
                        : "transparent",
                  }}
                  onClick={() => setRoleTab(tab)}
                >
                  {roleTabLabelMap[tab]} ({totalByRoleTab[tab]})
                </button>
              ))}
            </div>

            {selectedCredits.length === 0 ? (
              <div
                className="border p-4 font-mono text-xs"
                style={{
                  borderColor: styles.border,
                  background: styles.panel,
                  color: styles.muted,
                }}
              >
                No {roleTabLabelMap[roleTab].toLowerCase()} credits available in
                this view.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {selectedCredits.map((credit) => {
                  const roleLine =
                    credit.character ?? credit.job ?? credit.department;

                  return (
                    <Link
                      key={`${credit.mediaType}-${credit.tmdbId}-${credit.character ?? credit.job ?? "credit"}`}
                      to={
                        credit.mediaType === "movie"
                          ? "/cinema/$tmdbId"
                          : "/serials/$tmdbId"
                      }
                      params={{ tmdbId: String(credit.tmdbId) }}
                      className="border p-3 transition-colors"
                      style={{
                        borderColor: styles.border,
                        background: styles.panel,
                      }}
                      viewTransition
                    >
                      <div className="flex gap-3">
                        <img
                          src={getCreditPosterUrl(credit.posterPath)}
                          alt={`${credit.title} poster`}
                          className="h-20 w-14 shrink-0 object-cover"
                        />

                        <div className="min-w-0 flex-1">
                          <p
                            className="truncate font-mono text-xs font-bold"
                            style={{ color: styles.text }}
                          >
                            {credit.title}
                          </p>
                          <p
                            className="font-mono text-[10px]"
                            style={{ color: styles.faint }}
                          >
                            {credit.releaseYear ?? "Year unknown"} ·{" "}
                            {credit.mediaType === "movie" ? (
                              <span className="inline-flex items-center gap-1">
                                <Film className="h-3 w-3" /> Cinema
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1">
                                <Tv className="h-3 w-3" /> Serial
                              </span>
                            )}
                          </p>
                          {roleLine ? (
                            <p
                              className="mt-1 line-clamp-2 font-mono text-[11px]"
                              style={{ color: styles.muted }}
                            >
                              {roleLine}
                            </p>
                          ) : null}
                          {credit.voteAverage !== null ? (
                            <p
                              className="mt-1 font-mono text-[10px]"
                              style={{ color: styles.faint }}
                            >
                              TMDB {credit.voteAverage.toFixed(1)}
                              {credit.voteCount !== null
                                ? ` · ${credit.voteCount.toLocaleString()} votes`
                                : ""}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};
