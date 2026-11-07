import { useState } from "react";
import { CreditsList } from "@/components/film/CreditsList";
import { DuotoneBackdrop } from "@/components/film/DuotoneBackdrop";
import type { PersonDetailResponse } from "@/features/people/api";
import { buildPersonExternalLinks } from "./external-links";
import { toAge, toLifeDate, toPersonStats, toWorkedJobs } from "./person-hero.model";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

type PersonHeroProps = {
  role: "actor" | "director";
  detail: PersonDetailResponse;
  now?: Date;
};

const linkText = (label: string, href: string) => {
  if (label === "Homepage") return new URL(href).host.replace(/^www\./, "");
  return href.split("/").filter(Boolean).pop() ?? label;
};

// The person as an opening credit: slate with life facts, a still from their best-known title,
// the portrait with its credits, then name, jobs, counts and a short biography.
export const PersonHero = ({ role, detail, now }: PersonHeroProps) => {
  const [isBioOpen, setIsBioOpen] = useState(false);
  const { person } = detail;
  const still = detail.knownFor.find((credit) => credit.backdropPath);
  const born = toLifeDate(person.birthday);
  const died = toLifeDate(person.deathday);
  const age = toAge(person.birthday, person.deathday, now ?? new Date());
  const slateFacts = [born ? `B. ${born}` : null, died ? `D. ${died}` : null, person.placeOfBirth].filter(Boolean).join(" · ");
  const jobs = role === "director" ? toWorkedJobs(detail).slice(0, 3).map((row) => row.job) : ["Acting"];
  const stats = toPersonStats(detail, role);
  const links = buildPersonExternalLinks(person);

  return (
    <section className="overflow-hidden rounded-[3px] border border-[color:var(--line)]">
      <div className="slate mono-meta uppercase">
        <span>{`Interis · Person · ${role === "director" ? "Director" : "Actor"}`}</span>
        {slateFacts ? <span className="truncate">{slateFacts}</span> : null}
      </div>

      <div className="relative h-36 sm:h-40">
        <DuotoneBackdrop tone="film">
          {still?.backdropPath ? <img src={`${TMDB_IMAGE_BASE}/w1280${still.backdropPath}`} alt="" className="size-full object-cover" /> : null}
        </DuotoneBackdrop>
        {still ? (
          <span className="mono-meta absolute top-2 right-3 uppercase text-white/70">
            {["Still", still.title, still.releaseYear].filter(Boolean).join(" · ")}
          </span>
        ) : null}
      </div>

      <div className="relative -mt-16 flex flex-col gap-5 px-4 pb-5 sm:flex-row sm:px-5">
        <div className="w-32 shrink-0">
          {person.profilePath ? (
            <img src={`${TMDB_IMAGE_BASE}/w342${person.profilePath}`} alt="" className="aspect-2/3 w-full rounded-[2px] border border-[color:var(--line)] object-cover" />
          ) : (
            <div className="display-3 flex aspect-2/3 w-full items-center justify-center rounded-[2px] border border-[color:var(--line)] bg-card text-muted-foreground">
              {person.name.slice(0, 1)}
            </div>
          )}
          <CreditsList
            className="mt-2.5 text-[11px]"
            rows={[
              { label: "Born", value: born },
              { label: "Died", value: died },
              { label: "Age", value: age !== null ? String(age) : null },
              ...links.map((link) => ({
                label: link.label,
                value: (
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    title={linkText(link.label, link.href)}
                    className="flex min-w-0 justify-end text-primary hover:underline"
                  >
                    <span className="truncate">{linkText(link.label, link.href)}</span>
                    <span aria-hidden className="ml-1 shrink-0">↗</span>
                  </a>
                ),
              })),
            ]}
          />
        </div>

        <div className="min-w-0 flex-1 sm:pt-20">
          <p className="kicker text-muted-foreground">{jobs.join(" · ")}</p>
          <h1 className="display-1 leading-none text-foreground">{person.name}</h1>
          {stats.length > 0 ? (
            <p className="mono-meta mt-2 flex flex-wrap gap-x-3.5 uppercase text-muted-foreground">
              {stats.map((stat) => (
                <span key={stat.label}>
                  <b className="text-base text-foreground">{stat.value}</b> <span>{stat.label}</span>
                </span>
              ))}
            </p>
          ) : null}
          {person.biography ? (
            <div className="mt-2.5">
              <p className={`body whitespace-pre-line text-muted-foreground ${isBioOpen ? "" : "line-clamp-3"}`}>{person.biography}</p>
              <button type="button" onClick={() => setIsBioOpen((open) => !open)} className="body-s border-b border-[color:var(--line-strong)] text-foreground">
                {isBioOpen ? "less" : "more"}
              </button>
              {person.biographySource ? <p className="caption mt-1 text-[color:var(--faint)]">{person.biographySource}</p> : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};
