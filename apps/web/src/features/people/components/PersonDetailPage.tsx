import { useState } from "react";
import { usePersonCredits, usePersonDetail } from "@/features/people/hooks/usePeople";
import type { PersonRouteRole } from "@/features/people/shared";
import { PersonFilmography } from "./person-detail/PersonFilmography";
import { PersonHero } from "./person-detail/PersonHero";
import { PersonKnownFor } from "./person-detail/PersonKnownFor";
import { type CreditMediaTab, type CreditRoleTab } from "./person-detail/types";
import { DocumentSkeleton, PosterGridSkeleton } from "@/components/ui/PageSkeletons";

type PersonDetailPageProps = {
  role: PersonRouteRole;
  slug: string;
};

export const PersonDetailPage = ({ role, slug }: PersonDetailPageProps) => {
  const isValidSlug = slug.trim().length > 0;

  const [mediaTab, setMediaTab] = useState<CreditMediaTab>("combined");
  const [roleTab, setRoleTab] = useState<CreditRoleTab>(
    role === "director" ? "crew" : "cast",
  );

  const detailQuery = usePersonDetail(role, slug, isValidSlug);
  const creditsQuery = usePersonCredits(role, slug, mediaTab, roleTab, isValidSlug);

  if (!isValidSlug) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <p className="body-s text-muted-foreground">Invalid person slug.</p>
      </main>
    );
  }

  if (detailQuery.isPending) {
    return (
      <DocumentSkeleton label="Loading person">
        <PosterGridSkeleton count={12} />
      </DocumentSkeleton>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <p className="body-s text-muted-foreground">Could not load this person right now.</p>
      </main>
    );
  }

  const detail = detailQuery.data;
  const counts = detail.credits.counts;


  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 px-4 py-6">
      <PersonHero role={role} detail={detail} />
      <PersonKnownFor credits={detail.knownFor} />

      <section aria-label="Filmography">
        <h2 className="display-3 mb-3 text-foreground">Filmography</h2>
        <PersonFilmography
          counts={counts}
          mediaTab={mediaTab}
          roleTab={roleTab}
          onMediaTabChange={setMediaTab}
          onRoleTabChange={setRoleTab}
          credits={creditsQuery.data ?? []}
          isLoading={creditsQuery.isPending}
          hasMore={creditsQuery.hasNextPage}
          isLoadingMore={creditsQuery.isFetchingNextPage}
          onLoadMore={() => void creditsQuery.fetchNextPage()}
        />
      </section>
    </main>
  );
};
