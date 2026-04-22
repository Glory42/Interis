import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Globe,
  Heart,
  Lock,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  useDeleteList,
  useLikeList,
  useListDetail,
  useUnlikeList,
} from "@/features/lists/hooks/useLists";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

const getPosterUrl = (posterPath: string | null): string => {
  if (!posterPath) return "";
  return `${TMDB_IMAGE_BASE}/w185${posterPath}`;
};

type ProfileListDetailPageProps = {
  username: string;
  listId: string;
};

export const ProfileListDetailPage = ({
  username,
  listId,
}: ProfileListDetailPageProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const detailQuery = useListDetail(listId);
  const list = detailQuery.data;

  const isOwnProfile =
    Boolean(user) && list ? user?.id === list.userId : false;

  const deleteMutation = useDeleteList(listId, username);
  const [deletePending, setDeletePending] = useState(false);

  const viewerUsername = user?.username;
  const likeMutation = useLikeList(listId, viewerUsername);
  const unlikeMutation = useUnlikeList(listId, viewerUsername);
  const isLiked = list?.likedByViewer ?? false;
  const likeCount = list?.likeCount ?? 0;
  const likeLoading = likeMutation.isPending || unlikeMutation.isPending;

  const handleLikeToggle = () => {
    if (likeLoading) return;
    if (isLiked) {
      unlikeMutation.mutate();
    } else {
      likeMutation.mutate();
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this list? This cannot be undone.")) return;
    setDeletePending(true);
    try {
      await deleteMutation.mutateAsync();
      void navigate({ to: "/profile/$username/lists", params: { username } });
    } finally {
      setDeletePending(false);
    }
  };

  if (detailQuery.isPending) {
    return (
      <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
        <Spinner /> Loading list...
      </div>
    );
  }

  if (detailQuery.isError || !list) {
    return (
      <div className="border border-border/60 bg-card/30 p-4 text-sm text-destructive">
        This list could not be loaded.
      </div>
    );
  }

  const derivedTypeLabel =
    list.derivedType === "cinema"
      ? "CINEMA"
      : list.derivedType === "serial"
        ? "SERIAL"
        : list.derivedType === "mixed"
          ? "MIXED"
          : null;

  return (
    <div>
      <Link
        to="/profile/$username/lists"
        params={{ username }}
        className="mb-6 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to lists
      </Link>

      <div className="mb-8 border-b border-border/50 pb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="mb-2 font-mono text-xl font-bold text-foreground">
              {list.title}
            </h1>
            {list.description ? (
              <p className="mb-3 font-mono text-sm text-muted-foreground">
                {list.description}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] font-semibold profile-shell-accent">
                {list.itemCount}
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">
                items
              </span>
              {derivedTypeLabel ? (
                <span className="border border-border/60 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                  {derivedTypeLabel}
                </span>
              ) : null}
              {list.isRanked ? (
                <span className="border border-border/60 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                  RANKED
                </span>
              ) : null}
              <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                {list.isPublic ? (
                  <Globe className="h-3 w-3" />
                ) : (
                  <Lock className="h-3 w-3" />
                )}
                {list.isPublic ? "Public" : "Private"}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {/* Like button — shown to authenticated non-owners */}
            {user && !isOwnProfile ? (
              <button
                type="button"
                onClick={handleLikeToggle}
                disabled={likeLoading}
                className={cn(
                  "inline-flex items-center gap-1.5 border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                  isLiked
                    ? "border-rose-500/50 text-rose-500 hover:border-rose-500"
                    : "border-border/70 text-muted-foreground hover:border-rose-500/50 hover:text-rose-400",
                )}
              >
                <Heart className={cn("h-3 w-3", isLiked && "fill-current")} />
                {likeCount > 0 ? likeCount : null}
              </button>
            ) : !user && likeCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
                <Heart className="h-3 w-3" />
                {likeCount}
              </span>
            ) : null}

            {isOwnProfile ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    void navigate({
                      to: "/profile/$username/lists/$listId/edit",
                      params: { username, listId },
                    });
                  }}
                  className="inline-flex items-center gap-1.5 border border-border/70 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => { void handleDelete(); }}
                  disabled={deletePending}
                  className="inline-flex items-center gap-1.5 border border-destructive/40 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-destructive/70 transition-colors hover:border-destructive hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deletePending ? (
                    <Spinner className="h-3 w-3" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                  Delete
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {list.items.length === 0 ? (
        <div className="border border-dashed border-border/50 py-12 text-center">
          <p className="font-mono text-sm text-muted-foreground">
            {isOwnProfile
              ? "Edit this list to add films and series."
              : "This list is empty."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 lg:grid-cols-6">
          {list.items.map((item, idx) => (
            <Link
              key={item.id}
              to={
                item.itemType === "cinema"
                  ? "/cinema/$tmdbId"
                  : "/serials/$tmdbId"
              }
              params={{ tmdbId: String(item.tmdbId ?? "") }}
              className="group block"
              viewTransition
            >
              <div className="relative mb-1.5 aspect-2/3 overflow-hidden border border-border/70 bg-card/25">
                {item.posterPath ? (
                  <img
                    src={getPosterUrl(item.posterPath)}
                    alt={item.title ?? ""}
                    className="h-full w-full object-cover opacity-90 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
                    loading="lazy"
                  />
                ) : null}
                {list.isRanked ? (
                  <div className="absolute left-0 top-0 bg-background/80 px-1.5 py-0.5">
                    <span className="font-mono text-[10px] font-bold text-foreground">
                      {idx + 1}
                    </span>
                  </div>
                ) : null}
              </div>
              <p className="line-clamp-1 text-[11px] font-semibold text-foreground/95 transition-colors group-hover:text-primary">
                {item.title ?? "Unknown"}
              </p>
              {item.releaseYear ? (
                <p className="mt-0.5 text-[10px] text-muted-foreground/85">
                  {item.releaseYear}
                </p>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
