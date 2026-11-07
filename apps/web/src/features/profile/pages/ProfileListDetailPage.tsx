import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Ellipsis, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SentenceSelect } from "@/components/ui/SentenceSelect";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ReportContentDialog } from "@/features/reports/components/ReportContentDialog";
import { ListDetailPoster, ListDetailRow } from "@/features/lists/components/ListDetailItems";
import { useDeleteList, useLikeList, useListDetail, useUnlikeList } from "@/features/lists/hooks/useLists";
import { cn } from "@/lib/utils";
import { DocumentSkeleton, PosterGridSkeleton } from "@/components/ui/PageSkeletons";

type ProfileListDetailPageProps = {
  username: string;
  listId: string;
};

type ListView = "rows" | "grid";

const viewOptions = [
  { value: "rows", word: "ranked rows", label: "Ranked rows" },
  { value: "grid", word: "a poster grid", label: "Poster grid" },
] as const;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const kindLabel = (derivedType: string | null, count: number) => {
  const noun = derivedType === "movie" ? "film" : derivedType === "serial" ? "series" : "title";
  return `${count} ${noun}${count === 1 || noun === "series" ? "" : "s"}`;
};

const menuItem = "block w-full px-4 py-2 text-left text-xs text-muted-foreground hover:bg-foreground/5 hover:text-foreground";

export const ProfileListDetailPage = ({ username, listId }: ProfileListDetailPageProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const detailQuery = useListDetail(listId);
  const list = detailQuery.data;
  const isOwnProfile = Boolean(user && list && user.id === list.userId);
  const deleteMutation = useDeleteList(listId, username);
  const likeMutation = useLikeList(listId, user?.username);
  const unlikeMutation = useUnlikeList(listId, user?.username);
  const [view, setView] = useState<ListView>("rows");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isReporting, setIsReporting] = useState(false);

  if (detailQuery.isPending) {
    return (
      <DocumentSkeleton label="Loading list" withPoster={false} className="max-w-none px-0 py-0">
        <PosterGridSkeleton count={6} />
      </DocumentSkeleton>
    );
  }

  if (detailQuery.isError || !list) {
    return <p className="body-s text-[color:var(--danger)]">This list could not be loaded.</p>;
  }

  const isLiked = list.likedByViewer;
  const isLikePending = likeMutation.isPending || unlikeMutation.isPending;
  const updated = new Date(list.updatedAt);
  const slateLeft = ["List", list.isRanked ? "Ranked" : null, kindLabel(list.derivedType, list.itemCount), list.isPublic ? "Public" : "Private"]
    .filter(Boolean)
    .join(" · ");
  const slateRight = [`By ${username}`, Number.isNaN(updated.getTime()) ? null : `Updated ${MONTHS[updated.getMonth()]} ${updated.getDate()}`]
    .filter(Boolean)
    .join(" · ");

  const deleteList = async () => {
    await deleteMutation.mutateAsync();
    setIsConfirmingDelete(false);
    void navigate({ to: "/profile/$username/lists", params: { username } });
  };

  return (
    <div>
      <Link
        to="/profile/$username/lists"
        params={{ username }}
        className="mono-meta mb-4 inline-flex items-center gap-1.5 uppercase text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="size-3" />
        Lists
      </Link>

      <div className="rounded-[3px] border border-[color:var(--line)]">
        <div className="slate mono-meta rounded-t-[3px] uppercase">
          <span>{slateLeft}</span>
          <span>{slateRight}</span>
        </div>

        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="display-2 leading-none text-foreground">{list.title}</h1>
              {list.description ? <p className="body mt-2 text-muted-foreground">{list.description}</p> : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {user && !isOwnProfile ? (
                <Button
                  variant="outline"
                  size="md"
                  aria-label={isLiked ? "Unlike this list" : "Like this list"}
                  aria-pressed={isLiked}
                  disabled={isLikePending}
                  onClick={() => (isLiked ? unlikeMutation.mutate() : likeMutation.mutate())}
                >
                  <Heart aria-hidden className={cn("size-3.5 text-[color:var(--like)]", isLiked && "fill-current")} />
                  {list.likeCount > 0 ? `Like · ${list.likeCount}` : "Like"}
                </Button>
              ) : !user && list.likeCount > 0 ? (
                <span className="mono-meta text-muted-foreground">{`♥ ${list.likeCount}`}</span>
              ) : null}

              {user ? (
                <div
                  className="relative"
                  onBlur={(event) => !event.currentTarget.contains(event.relatedTarget) && setIsMenuOpen(false)}
                  onKeyDown={(event) => event.key === "Escape" && setIsMenuOpen(false)}
                >
                  <Button
                    variant="icon"
                    size="md"
                    aria-label="List actions"
                    aria-haspopup="menu"
                    aria-expanded={isMenuOpen}
                    onClick={() => setIsMenuOpen((open) => !open)}
                  >
                    <Ellipsis aria-hidden className="size-4" />
                  </Button>
                  {isMenuOpen ? (
                    <div role="menu" className="surface-card absolute top-full right-0 z-40 mt-1 min-w-32 overflow-hidden">
                      {isOwnProfile ? (
                        <>
                          <button
                            type="button"
                            role="menuitem"
                            className={menuItem}
                            onClick={() => void navigate({ to: "/profile/$username/lists/$listId/edit", params: { username, listId } })}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            className={cn(menuItem, "text-[color:var(--danger)]")}
                            onClick={() => {
                              setIsMenuOpen(false);
                              setIsConfirmingDelete(true);
                            }}
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          role="menuitem"
                          className={menuItem}
                          onClick={() => {
                            setIsMenuOpen(false);
                            setIsReporting(true);
                          }}
                        >
                          Report list
                        </button>
                      )}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          {list.items.length === 0 ? (
            <p className="body-s mt-4 border-t border-[color:var(--line)] pt-4 text-muted-foreground">
              {isOwnProfile ? "Edit this list to add films and series." : "This list is empty."}
            </p>
          ) : view === "rows" ? (
            <ol className="mt-4">
              {list.items.map((item, index) => (
                <ListDetailRow key={item.id} item={item} rank={list.isRanked ? index + 1 : null} />
              ))}
            </ol>
          ) : (
            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-6">
              {list.items.map((item, index) => (
                <ListDetailPoster key={item.id} item={item} rank={list.isRanked ? index + 1 : null} />
              ))}
            </div>
          )}

          {list.items.length > 0 ? (
            <p className="body-s mt-3 text-muted-foreground">
              {"Viewing as "}
              <SentenceSelect value={view} options={viewOptions} onChange={setView} />
              {"."}
            </p>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        isOpen={isConfirmingDelete}
        context="List · Delete"
        title="Delete this list?"
        description="The list and its notes go for good. The films and series stay in your diary."
        confirmLabel="Delete list"
        cancelLabel="Keep list"
        isDestructive
        isConfirming={deleteMutation.isPending}
        onConfirm={() => void deleteList()}
        onClose={() => setIsConfirmingDelete(false)}
      />
      <ReportContentDialog isOpen={isReporting} onClose={() => setIsReporting(false)} targetType="list" targetId={list.id} />
    </div>
  );
};
