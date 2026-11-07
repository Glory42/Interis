import { ProfileTabEmptyState } from "@/features/profile/components/ProfileTabEmptyState";
import { ProfileMediaGridSkeleton } from "@/features/profile/components/ProfileMediaGridSkeleton";
import { ProfileWatchingRow } from "@/features/profile/components/ProfileWatchingRow";
import { useIsOwnProfile, useUserCurrentlyWatching } from "@/features/profile/hooks/useProfile";

type ProfileWatchingPageProps = {
  username: string;
};

export const ProfileWatchingPage = ({ username }: ProfileWatchingPageProps) => {
  const currentlyWatchingQuery = useUserCurrentlyWatching(username);
  const isOwner = useIsOwnProfile(username);
  const items = currentlyWatchingQuery.data ?? [];

  return (
    <>
      {currentlyWatchingQuery.isPending ? <ProfileMediaGridSkeleton /> : null}

      {currentlyWatchingQuery.isError ? (
        <p className="body-s text-[color:var(--danger)]">Could not load what this profile is watching.</p>
      ) : null}

      {!currentlyWatchingQuery.isPending &&
      !currentlyWatchingQuery.isError &&
      items.length === 0 ? (
        <ProfileTabEmptyState
          isOwner={isOwner}
          visitorText="Not in the middle of a series."
          ownerAction={{ label: "Find a series →", to: "/serials" }}
        />
      ) : null}

      {!currentlyWatchingQuery.isPending &&
      !currentlyWatchingQuery.isError &&
      items.length > 0 ? (
        <section aria-label="Watching">
          <div className="flex items-baseline justify-between border-b border-[color:var(--line)] pb-2">
            <h2 className="display-3 text-foreground">Watching</h2>
            <span className="mono-meta uppercase text-muted-foreground">
              {`${items.length} series in progress`}
            </span>
          </div>
          {items.map((item) => (
            <ProfileWatchingRow key={`watching-${item.tmdbId}`} series={item} isOwner={isOwner} />
          ))}
        </section>
      ) : null}
    </>
  );
};
