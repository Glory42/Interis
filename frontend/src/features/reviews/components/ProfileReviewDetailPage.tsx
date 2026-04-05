import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Film,
  Heart,
  Loader2,
  MessageSquare,
  TriangleAlert,
  Tv,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { SpaceRatingDisplay } from "@/features/films/components/SpaceRating";
import { formatRatingOutOfFiveLabel } from "@/features/films/components/spaceRating.utils";
import { getPosterUrl } from "@/features/films/components/utils";
import {
  useAddReviewComment,
  useLikeReview,
  useReviewComments,
  useReviewDetail,
  useUnlikeReview,
} from "@/features/reviews/hooks/useReviews";
import { cn } from "@/lib/utils";

type ProfileReviewDetailPageProps = {
  username: string;
  reviewId: string;
};

const formatRelativeTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const deltaSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const absSeconds = Math.abs(deltaSeconds);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (absSeconds < 60) {
    return formatter.format(deltaSeconds, "second");
  }

  const deltaMinutes = Math.round(deltaSeconds / 60);
  if (Math.abs(deltaMinutes) < 60) {
    return formatter.format(deltaMinutes, "minute");
  }

  const deltaHours = Math.round(deltaMinutes / 60);
  if (Math.abs(deltaHours) < 24) {
    return formatter.format(deltaHours, "hour");
  }

  return formatter.format(Math.round(deltaHours / 24), "day");
};

const formatDateLabel = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export function ProfileReviewDetailPage({ username, reviewId }: ProfileReviewDetailPageProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [commentDraft, setCommentDraft] = useState("");
  const [isSpoilerRevealed, setIsSpoilerRevealed] = useState(false);

  const detailQuery = useReviewDetail(username, reviewId, username.trim().length > 0);
  const mediaType = detailQuery.data?.mediaType ?? "movie";

  const commentsQuery = useReviewComments(reviewId, mediaType, Boolean(detailQuery.data));
  const addCommentMutation = useAddReviewComment(reviewId, mediaType);
  const likeReviewMutation = useLikeReview(reviewId, mediaType);
  const unlikeReviewMutation = useUnlikeReview(reviewId, mediaType);

  if (detailQuery.isPending) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-12">
        <div className="h-64 animate-pulse  border border-border/60 bg-card/35" />
      </div>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className=" border border-destructive/45 bg-destructive/10 p-5 text-sm text-destructive">
          Could not load this review.
        </div>
      </div>
    );
  }

  const detail = detailQuery.data;
  const canReadSpoiler = !detail.containsSpoilers || isSpoilerRevealed;
  const displayAuthorName = detail.author.displayUsername ?? detail.author.username;
  const authorAvatar = detail.author.avatarUrl ?? detail.author.image;
  const likeBusy = likeReviewMutation.isPending || unlikeReviewMutation.isPending;
  const comments = commentsQuery.data ?? [];
  const heroImageUrl = getPosterUrl(detail.media.posterPath);
  const ratingLabel = formatRatingOutOfFiveLabel(detail.ratingOutOfFive);
  const mediaCreditParts = [
    detail.media.releaseYear ? String(detail.media.releaseYear) : null,
    detail.media.director,
    detail.media.creator,
  ].filter((part): part is string => part !== null && part.trim().length > 0);

  const goToLogin = async () => {
    const redirectPath = `${window.location.pathname}${window.location.search}`;
    await navigate({
      to: "/login",
      search: { redirect: redirectPath },
    });
  };

  const toggleLike = async () => {
    if (likeBusy) {
      return;
    }

    if (!user) {
      await goToLogin();
      return;
    }

    if (detail.engagement.viewerHasLiked) {
      await unlikeReviewMutation.mutateAsync();
      return;
    }

    await likeReviewMutation.mutateAsync();
  };

  const submitComment = async () => {
    const normalizedContent = commentDraft.trim();
    if (normalizedContent.length === 0 || addCommentMutation.isPending) {
      return;
    }

    if (!user) {
      await goToLogin();
      return;
    }

    await addCommentMutation.mutateAsync({ content: normalizedContent });
    setCommentDraft("");
  };

  return (
    <div className="min-h-screen">
      <section className="theme-hero-shell relative h-[26rem] overflow-hidden sm:h-[28rem]">
        <img
          src={heroImageUrl}
          alt={`${detail.media.title} artwork`}
          className="theme-hero-media h-full w-full scale-[1.03] object-cover opacity-25 blur-[1px]"
        />
        <div className="theme-hero-gradient-layer absolute inset-0" />
        <div className="theme-hero-pattern-layer absolute inset-0" />
        <div className="theme-hero-readable-overlay absolute inset-y-0 left-0 w-[74%] bg-linear-to-r from-background/78 via-background/34 to-transparent" />
        <div className="theme-hero-readable-overlay absolute inset-x-0 bottom-0 h-[54%] bg-linear-to-t from-background/74 via-background/26 to-transparent" />

        <div className="absolute left-0 right-0 top-6 z-[22] mx-auto w-full max-w-7xl px-4">
          <Button
            asChild
            variant="outline"
            size="sm"
            className=" bg-background/45 backdrop-blur-sm"
          >
            <Link to="/profile/$username/reviews" params={{ username }} viewTransition>
              <ArrowLeft className="h-4 w-4" /> Back to reviews
            </Link>
          </Button>
        </div>

        <div className="theme-hero-safe-area mx-auto w-full max-w-7xl px-4">
          <div className="theme-hero-safe-content flex w-full items-end gap-6">
            <div className="-mb-4 hidden shrink-0 sm:block">
              {detail.mediaType === "tv" ? (
                <Link to="/serials/$tmdbId" params={{ tmdbId: String(detail.media.tmdbId) }}>
                  <div className="h-40 w-28 overflow-hidden  border border-border/60 shadow-2xl">
                    <img
                      src={getPosterUrl(detail.media.posterPath)}
                      alt={`${detail.media.title} poster`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </Link>
              ) : (
                <Link to="/cinema/$tmdbId" params={{ tmdbId: String(detail.media.tmdbId) }}>
                  <div className="h-40 w-28 overflow-hidden  border border-border/60 shadow-2xl">
                    <img
                      src={getPosterUrl(detail.media.posterPath)}
                      alt={`${detail.media.title} poster`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </Link>
              )}
            </div>

            <div className="flex-1 pb-1">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px]">
                {detail.mediaType === "tv" ? (
                  <Tv className="h-3 w-3 text-primary" />
                ) : (
                  <Film className="h-3 w-3 text-primary" />
                )}
                <span className="theme-kicker font-bold uppercase tracking-[0.16em] text-primary">
                  {detail.mediaType === "tv" ? "Series Review" : "Film Review"}
                </span>
                {detail.containsSpoilers ? (
                  <span className=" border border-amber-500/35 bg-amber-500/10 px-2 py-0.5 text-amber-200">
                    Spoilers
                  </span>
                ) : null}
                {detail.media.genres.length > 0 ? (
                  <span className=" bg-secondary/75 px-2 py-0.5 text-muted-foreground">
                    {detail.media.genres
                      .slice(0, 2)
                      .map((genre) => genre.name)
                      .join(" / ")}
                  </span>
                ) : null}
              </div>

              <h1 className="theme-display-title text-4xl font-black leading-none tracking-tight text-foreground">
                {detail.media.title}
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                {mediaCreditParts.length > 0
                  ? mediaCreditParts.join(" · ")
                  : "No additional credits available"}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  {authorAvatar ? (
                    <img
                      src={authorAvatar}
                      alt={`${detail.author.username} avatar`}
                      className="h-8 w-8  border border-border/70 object-cover"
                    />
                  ) : (
                    <span className="inline-flex h-8 w-8 items-center justify-center  border border-border/70 bg-secondary text-[10px] font-semibold text-secondary-foreground">
                      {detail.author.username.slice(0, 1).toUpperCase()}
                    </span>
                  )}

                  <p className="text-xs text-muted-foreground">
                    by{" "}
                    <Link
                      to="/profile/$username"
                      params={{ username: detail.author.username }}
                      className="font-semibold text-foreground hover:text-primary"
                      viewTransition
                    >
                      {displayAuthorName}
                    </Link>{" "}
                    · {formatRelativeTime(detail.createdAt)}
                  </p>
                </div>

                <div className="inline-flex items-center gap-1.5  border border-border/70 bg-secondary/40 px-2.5 py-1 text-xs font-semibold text-foreground">
                  <SpaceRatingDisplay ratingOutOfFive={detail.ratingOutOfFive} size="sm" />
                  <span>{ratingLabel ?? "Unrated"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 px-4 pb-16 pt-14 sm:pt-16 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-8">
          <section className=" border border-border/60 bg-card/35 p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-bold text-foreground">Review</h2>
              <span className="text-xs text-muted-foreground">
                @{detail.author.username}
              </span>
            </div>

            {detail.containsSpoilers && !canReadSpoiler ? (
              <button
                type="button"
                className="inline-flex items-center gap-2  border border-amber-500/35 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-500/15"
                onClick={() => setIsSpoilerRevealed(true)}
              >
                <TriangleAlert className="h-3.5 w-3.5" />
                Spoiler warning - click to reveal
              </button>
            ) : null}

            <p
              className={cn(
                "mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/95",
                !canReadSpoiler ? "hidden" : "",
              )}
            >
              {detail.content}
            </p>

            <div className="mt-5 flex items-center gap-2 border-t border-border/60 pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className=""
                disabled={likeBusy}
                onClick={() => {
                  void toggleLike();
                }}
              >
                {likeBusy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Heart
                    className={cn(
                      "h-3.5 w-3.5",
                      detail.engagement.viewerHasLiked ? "fill-primary text-primary" : "",
                    )}
                  />
                )}
                {detail.engagement.likeCount}
              </Button>

              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <MessageSquare className="h-3.5 w-3.5" />
                {detail.engagement.commentCount}
              </span>
            </div>
          </section>

          <section
            id="review-comments"
            className=" border border-border/60 bg-card/35 p-5 sm:p-6"
          >
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-foreground">Comments</h2>
              <span className="text-xs text-muted-foreground">
                {detail.engagement.commentCount} total
              </span>
            </div>

            <div className="space-y-3">
              {commentsQuery.isPending ? (
                <p className="text-xs text-muted-foreground">Loading comments...</p>
              ) : null}

              {commentsQuery.isError ? (
                <p className="text-xs text-destructive">Could not load comments.</p>
              ) : null}

              {!commentsQuery.isPending && !commentsQuery.isError && comments.length === 0 ? (
                <p className="text-xs text-muted-foreground">No comments yet.</p>
              ) : null}

              {!commentsQuery.isPending && !commentsQuery.isError
                ? comments.map((comment) => {
                    const commentAuthor =
                      comment.authorDisplayUsername ?? comment.authorUsername;
                    const commentAvatar = comment.authorAvatarUrl ?? comment.authorImage;

                    return (
                      <article
                        key={comment.id}
                        className=" border border-border/60 bg-card/50 p-3"
                      >
                        <div className="mb-1.5 flex items-center gap-2">
                          {commentAvatar ? (
                            <img
                              src={commentAvatar}
                              alt={`${comment.authorUsername} avatar`}
                              className="h-7 w-7  border border-border/60 object-cover"
                            />
                          ) : (
                            <span className="inline-flex h-7 w-7 items-center justify-center  border border-border/60 bg-secondary text-[10px] font-semibold text-secondary-foreground">
                              {comment.authorUsername.slice(0, 1).toUpperCase()}
                            </span>
                          )}

                          <p className="text-[11px] text-muted-foreground">
                            <span className="font-semibold text-foreground">{commentAuthor}</span>
                            <span> · {formatRelativeTime(comment.createdAt)}</span>
                          </p>
                        </div>

                        <p className="whitespace-pre-wrap text-sm text-foreground/95">
                          {comment.content}
                        </p>
                      </article>
                    );
                  })
                : null}
            </div>

            <div className="mt-5 space-y-2 border-t border-border/60 pt-5">
              <Textarea
                value={commentDraft}
                onChange={(event) => setCommentDraft(event.target.value.slice(0, 2000))}
                placeholder="Write a comment..."
                className="min-h-24  border-border/70 bg-background/40 text-sm"
              />

              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] text-muted-foreground">{commentDraft.length}/2000</p>
                <Button
                  type="button"
                  size="sm"
                  className=""
                  disabled={addCommentMutation.isPending || commentDraft.trim().length === 0}
                  onClick={() => {
                    void submitComment();
                  }}
                >
                  {addCommentMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : null}
                  Add Comment
                </Button>
              </div>

              {addCommentMutation.isError ? (
                <p className="text-xs text-destructive">Could not post comment.</p>
              ) : null}
            </div>
          </section>
        </div>

        <aside className="space-y-8 lg:col-span-4">
          <section className=" border border-border/60 bg-card/35 p-5">
            <h2 className="mb-5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Review Stats
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="h-3 w-3" />
                  Published
                </span>
                <span className="font-medium text-foreground">
                  {formatDateLabel(detail.createdAt)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <Clock3 className="h-3 w-3" />
                  Activity
                </span>
                <span className="font-medium text-foreground">
                  {formatRelativeTime(detail.createdAt)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <Heart className="h-3 w-3" />
                  Likes
                </span>
                <span className="font-medium text-foreground">
                  {detail.engagement.likeCount}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <MessageSquare className="h-3 w-3" />
                  Comments
                </span>
                <span className="font-medium text-foreground">
                  {detail.engagement.commentCount}
                </span>
              </div>
            </div>
          </section>

          <section className=" border border-border/60 bg-card/35 p-5">
            <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Watch Page
            </h2>

            {detail.mediaType === "tv" ? (
              <Button asChild variant="outline" className="w-full ">
                <Link to="/serials/$tmdbId" params={{ tmdbId: String(detail.media.tmdbId) }}>
                  Open series page
                </Link>
              </Button>
            ) : (
              <Button asChild variant="outline" className="w-full ">
                <Link to="/cinema/$tmdbId" params={{ tmdbId: String(detail.media.tmdbId) }}>
                  Open film page
                </Link>
              </Button>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
