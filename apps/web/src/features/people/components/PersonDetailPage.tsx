import { useState } from "react";
import { usePersonCredits, usePersonDetail } from "@/features/people/hooks/usePeople";
import { getPersonModuleStyles } from "@/features/people/components/styles";
import type { PersonRouteRole } from "@/features/people/shared";
import { PersonCreditsGrid } from "./person-detail/PersonCreditsGrid";
import { PersonCreditTabs } from "./person-detail/PersonCreditTabs";
import { PersonHero } from "./person-detail/PersonHero";
import { PersonKnownFor } from "./person-detail/PersonKnownFor";
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
  const creditsQuery = usePersonCredits(role, slug, mediaTab, roleTab, isValidSlug);

  if (!isValidSlug) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <div
          className="rounded-xl border p-5 font-mono text-xs"
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
          className="h-64 animate-pulse rounded-xl border"
          style={{ borderColor: styles.border, background: styles.panel }}
        />
      </main>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <div
          className="rounded-xl border p-5 font-mono text-xs"
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
  const counts = detail.credits.counts;

  const totalByMediaTab: Record<CreditMediaTab, number> = {
    combined: counts.combined.cast + counts.combined.crew,
    movies: counts.movies.cast + counts.movies.crew,
    tv: counts.tv.cast + counts.tv.crew,
  };

  const totalByRoleTab: Record<CreditRoleTab, number> = counts[mediaTab];

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 px-4 py-6">
      <PersonHero role={role} detail={detail} />
      <PersonKnownFor credits={detail.knownFor} />

      <section aria-label="Filmography">
        <h2 className="display-3 mb-3 text-foreground">Filmography</h2>
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
              credits={creditsQuery.data ?? []}
              roleTab={roleTab}
              isLoading={creditsQuery.isPending}
              hasMore={creditsQuery.hasNextPage}
              isLoadingMore={creditsQuery.isFetchingNextPage}
              onLoadMore={() => void creditsQuery.fetchNextPage()}
            />
      </section>
    </main>
  );
};
