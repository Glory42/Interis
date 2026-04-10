import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { usePersonDetail } from "@/features/people/hooks/usePeople";
import { getPersonModuleStyles } from "@/features/people/components/styles";
import type { PersonRouteRole } from "@/features/people/shared";
import { buildPersonExternalLinks } from "./person-detail/external-links";
import { PersonCreditsGrid } from "./person-detail/PersonCreditsGrid";
import { PersonCreditTabs } from "./person-detail/PersonCreditTabs";
import { PersonDetailHeader } from "./person-detail/PersonDetailHeader";
import { PersonDetailSidebar } from "./person-detail/PersonDetailSidebar";
import { type CreditMediaTab, type CreditRoleTab } from "./person-detail/types";

type PersonDetailPageProps = {
  role: PersonRouteRole;
  slug: string;
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
  const externalLinks = buildPersonExternalLinks(person);

  const totalByMediaTab: Record<CreditMediaTab, number> = {
    combined: detail.credits.combined.cast.length + detail.credits.combined.crew.length,
    movies: detail.credits.movies.cast.length + detail.credits.movies.crew.length,
    tv: detail.credits.tv.cast.length + detail.credits.tv.crew.length,
  };

  const totalByRoleTab: Record<CreditRoleTab, number> = {
    cast: detail.credits[mediaTab].cast.length,
    crew: detail.credits[mediaTab].crew.length,
  };

  return (
    <div className="min-h-screen">
      <div
        className="sticky top-12 z-20 flex items-center gap-3 border-b px-4 py-3"
        style={{
          background: "color-mix(in srgb, var(--card) 94%, var(--background) 6%)",
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
          <PersonDetailSidebar
            person={person}
            styles={styles}
            externalLinks={externalLinks}
          />

          <section>
            <PersonDetailHeader person={person} styles={styles} />

            <PersonCreditTabs
              styles={styles}
              mediaTab={mediaTab}
              roleTab={roleTab}
              totalByMediaTab={totalByMediaTab}
              totalByRoleTab={totalByRoleTab}
              onMediaTabChange={setMediaTab}
              onRoleTabChange={setRoleTab}
            />

            <PersonCreditsGrid
              styles={styles}
              credits={selectedCredits}
              roleTab={roleTab}
            />
          </section>
        </div>
      </main>
    </div>
  );
};
