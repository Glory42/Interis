import { LoadingRegion, TitleRowsSkeleton } from "@/components/ui/PageSkeletons";
import { useMemo, useState } from "react";
import { Layers3 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ListCard } from "@/features/lists/components/ListCard";
import { useUserLists } from "@/features/lists/hooks/useLists";
import { ProfileTabEmptyState } from "@/features/profile/components/ProfileTabEmptyState";
import { SentenceSelect, type SentenceOption } from "@/components/ui/SentenceSelect";
import { useIsOwnProfile } from "@/features/profile/hooks/useProfile";
import type { ListSummary } from "@/features/lists/api";

type ListFilter = "all" | "movie" | "serial" | "mixed";

const listFilterOptions: Array<SentenceOption<ListFilter>> = [
  { value: "all", word: "every kind", label: "Every kind" },
  { value: "movie", word: "film lists", label: "Film lists" },
  { value: "serial", word: "series lists", label: "Series lists" },
  { value: "mixed", word: "mixed lists", label: "Mixed lists" },
];

const filterMatches = (list: ListSummary, filter: ListFilter): boolean => {
  if (filter === "all") return true;
  return list.derivedType === filter;
};

type ProfileListsPageProps = {
  username: string;
};

export const ProfileListsPage = ({ username }: ProfileListsPageProps) => {
  const isOwnProfile = useIsOwnProfile(username);
  const listsQuery = useUserLists(username);
  const lists = useMemo(() => listsQuery.data ?? [], [listsQuery.data]);

  const [activeFilter, setActiveFilter] = useState<ListFilter>("all");

  const filteredLists = useMemo(
    () => lists.filter((list) => filterMatches(list, activeFilter)),
    [lists, activeFilter],
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <p className="body-s text-muted-foreground">
          {listsQuery.isPending
            ? "Loading lists…"
            : `Showing ${filteredLists.length.toLocaleString("en-US")} ${filteredLists.length === 1 ? "list" : "lists"}`}
          {!listsQuery.isPending && lists.length > 0 ? (
            <>
              {" · "}
              <SentenceSelect
                value={activeFilter}
                options={listFilterOptions}
                onChange={setActiveFilter}
                ariaLabel="Filter lists by kind"
              />
            </>
          ) : null}
          {!listsQuery.isPending ? "." : null}
        </p>

        {isOwnProfile ? (
          <Link
            to="/profile/$username/lists/new"
            params={{ username }}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-border/70 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            <Layers3 className="h-3 w-3" />
            New list
          </Link>
        ) : null}
      </div>

      {listsQuery.isPending ? (
        <LoadingRegion label="Loading lists">
          <TitleRowsSkeleton count={3} />
        </LoadingRegion>
      ) : listsQuery.isError ? (
        <div className="rounded-lg border border-border/60 bg-card/30 p-4 text-sm text-destructive">
          Could not load lists.
        </div>
      ) : lists.length === 0 ? (
        <ProfileTabEmptyState
          isOwner={isOwnProfile}
          visitorText="No public lists."
          ownerText="Start one from any film or series page, or with New list above."
        />
      ) : filteredLists.length === 0 ? (
        <div className="rounded-lg border border-border/60 bg-card/30 px-4 py-3 font-mono text-[11px] text-muted-foreground">
          No {activeFilter} lists yet.
        </div>
      ) : (
        <div>
          {filteredLists.map((list) => (
            <ListCard key={list.id} list={list} username={username} />
          ))}
        </div>
      )}
    </div>
  );
};
