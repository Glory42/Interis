import { useMemo, useState } from "react";
import { Layers3 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ListCard } from "@/features/lists/components/ListCard";
import { useUserLists } from "@/features/lists/hooks/useLists";
import { ProfileTabEmptyState } from "@/features/profile/components/ProfileTabEmptyState";
import type { ListSummary } from "@/features/lists/api";

type ListFilter = "all" | "cinema" | "serial" | "mixed";

const filterTabs: Array<{ key: ListFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "cinema", label: "Cinema" },
  { key: "serial", label: "Serial" },
  { key: "mixed", label: "Mixed" },
];

const filterMatches = (list: ListSummary, filter: ListFilter): boolean => {
  if (filter === "all") return true;
  return list.derivedType === filter;
};

type ProfileListsPageProps = {
  username: string;
};

export const ProfileListsPage = ({ username }: ProfileListsPageProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isOwnProfile =
    Boolean(user) && user?.username.toLowerCase() === username.toLowerCase();

  const listsQuery = useUserLists(username);
  const lists = listsQuery.data ?? [];

  const [activeFilter, setActiveFilter] = useState<ListFilter>("all");

  const filteredLists = useMemo(
    () => lists.filter((list) => filterMatches(list, activeFilter)),
    [lists, activeFilter],
  );

  return (
    <div>
      {/* Header row: title + filter tabs */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Lists{" "}
          {!listsQuery.isPending ? (
            <span className="profile-shell-accent">({lists.length})</span>
          ) : null}
        </p>
        {!listsQuery.isPending && lists.length > 0 ? (
          <div className="flex flex-wrap justify-end gap-1">
            {filterTabs.map((tab) => {
              const isActive = activeFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  className="border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest transition-colors"
                  style={
                    isActive
                      ? {
                          borderColor: "var(--profile-shell-accent)",
                          color: "var(--profile-shell-accent)",
                          background:
                            "color-mix(in srgb, var(--profile-shell-accent) 8%, transparent)",
                        }
                      : {
                          borderColor: "var(--profile-shell-border)",
                          color: "var(--profile-shell-muted)",
                          background: "transparent",
                        }
                  }
                  onClick={() => setActiveFilter(tab.key)}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {/* New List button under the header */}
      {isOwnProfile ? (
        <div className="mb-3">
          <button
            type="button"
            onClick={() => {
              void navigate({
                to: "/profile/$username/lists/new",
                params: { username },
              });
            }}
            className="flex items-center gap-2 border border-border/70 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            <Layers3 className="h-3 w-3" />
            New List
          </button>
        </div>
      ) : (
        <div className="mb-3" />
      )}

      {listsQuery.isPending ? (
        <div className="space-y-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse border-b border-border/30 bg-muted/10"
            />
          ))}
        </div>
      ) : listsQuery.isError ? (
        <div className="border border-border/60 bg-card/30 p-4 text-sm text-destructive">
          Could not load lists.
        </div>
      ) : lists.length === 0 ? (
        <ProfileTabEmptyState
          icon={Layers3}
          title="No lists yet"
          description={
            isOwnProfile
              ? "Create your first list to organize films and series."
              : "This profile has not created any public lists yet."
          }
        />
      ) : filteredLists.length === 0 ? (
        <div className="border border-border/60 bg-card/30 px-4 py-3 font-mono text-[11px] text-muted-foreground">
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
