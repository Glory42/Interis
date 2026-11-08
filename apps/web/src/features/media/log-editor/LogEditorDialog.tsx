import { useEffect, useState } from "react";
import { Heart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModalShell } from "@/components/ui/ModalShell";
import { LaunchTrack } from "@/components/film/rating/LaunchTrack";
import { LogEditorWhen, type LogWhen } from "@/features/media/log-editor/LogEditorWhen";
import { LogReviewField, type LogEditorReview } from "@/features/media/log-editor/LogReviewField";
import type { MediaKind } from "@/features/media/media-refresh";
import { PHONE_QUERY, useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";
import { REVIEW_MAX_LENGTH } from "@/types/api";

export type LogEditorMode = "log" | "edit" | "review";

type LogEditorDialogProps = {
  // log: a new log. edit: an existing log and its Review. review: a season or episode review.
  mode: LogEditorMode;
  // `subtitle` follows the medium in the slate: "S02 · E04" for an episode, else the year.
  media: { kind: MediaKind; title: string; posterUrl: string; year?: number | null; subtitle?: string };
  when: LogWhen;
  rating: number | null;
  onRatingChange: (nextValue: number | null) => void;
  liked: boolean;
  onLikedChange: (nextValue: boolean) => void;
  review: LogEditorReview;
  formError: string | null;
  isSubmitting: boolean;
  canSubmit?: boolean;
  onSubmit: () => void;
  onClose: () => void;
  deleteAction?: { label: string; onClick: () => void };
};

const accentByKind: Record<MediaKind, string> = { film: "var(--film)", tv: "var(--series)" };
const slateByMode: Record<LogEditorMode, string> = { log: "Log", edit: "Edit log", review: "Review" };

// One form on every screen: a modal on desktop, full screen with Cancel and Save on top on phones.
export const LogEditorDialog = ({
  mode,
  media,
  when,
  rating,
  onRatingChange,
  liked,
  onLikedChange,
  review,
  formError,
  isSubmitting,
  canSubmit = true,
  onSubmit,
  onClose,
  deleteAction,
}: LogEditorDialogProps) => {
  const isPhone = useMediaQuery(PHONE_QUERY);
  const [isWriting, setIsWriting] = useState(false);
  const { title, posterUrl, year, subtitle } = media;
  const accentColor = accentByKind[media.kind];
  const slateLabel = [
    slateByMode[mode],
    media.kind === "film" ? "Film" : "TV",
    subtitle ?? (year ? String(year) : null),
  ]
    .filter(Boolean)
    .join(" · ");
  const hasText = review.text.trim().length > 0;
  const postOrSave = isPhone ? (hasText ? "Post" : "Save") : hasText ? "Post review" : "Save log";
  const saveLabel = isSubmitting ? "Saving…" : mode === "log" ? postOrSave : "Save";
  // While typing on a phone the header shrinks to one line so the review keeps the room.
  const isCompact = isPhone && isWriting;

  // The page behind stays put while the form is open.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const deleteLink = deleteAction ? (
    <button
      type="button"
      onClick={deleteAction.onClick}
      disabled={isSubmitting}
      className="body-s text-[color:var(--danger)] hover:underline disabled:opacity-50"
    >
      {deleteAction.label}
    </button>
  ) : null;

  const likeButton = (
    <button
      type="button"
      onClick={() => onLikedChange(!liked)}
      className={cn(
        "body-s inline-flex items-center justify-center gap-1.5 transition-colors",
        isPhone && "rounded-[3px] border py-2.5",
        liked ? "border-[color:var(--like)]/45 text-[color:var(--like)]" : "border-[color:var(--line)] text-muted-foreground",
      )}
    >
      <Heart aria-hidden className="size-3.5" fill={liked ? "currentColor" : "transparent"} />
      {liked ? "Liked" : "Like"}
    </button>
  );

  return (
    <ModalShell
      onClose={onClose}
      portal={false}
      closeOnEscape={false}
      layout={isPhone ? "fullscreen" : "dialog"}
      overlayClassName="z-150"
      ariaCloseLabel="Close review modal"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={`${slateLabel} · ${title}`}
        className={cn(
          "relative flex flex-col overflow-hidden bg-background text-foreground animate-fade-up",
          isPhone
            ? "h-dvh w-full"
            : "w-[calc(100vw-2rem)] max-w-[680px] max-h-[calc(100dvh-2rem)] rounded-[4px] border shadow-2xl",
        )}
        style={isPhone ? undefined : { borderColor: `color-mix(in srgb, ${accentColor} 55%, transparent)` }}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          {isPhone ? (
            <div className="grid h-12 shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b border-[color:var(--line)] px-4">
              <button type="button" onClick={onClose} className="body-s justify-self-start text-muted-foreground">
                Cancel
              </button>
              <span className="mono-meta text-foreground">{slateLabel.split(" · ").slice(0, 2).join(" · ")}</span>
              <button
                type="submit"
                disabled={isSubmitting || !canSubmit}
                className="body-s justify-self-end font-semibold text-primary disabled:opacity-50"
              >
                {saveLabel}
              </button>
            </div>
          ) : (
            <div className="slate shrink-0">
              <span className="mono-meta truncate">
                <span>{slateLabel}</span>
                <span aria-hidden> · </span>
                <span style={{ color: accentColor }}>{title}</span>
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close review modal"
                className="rounded-[2px] p-1 text-[#bbbbbb] hover:text-white"
              >
                <X aria-hidden className="size-3.5" />
              </button>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-[18px]">
            <div className={cn("flex h-full gap-[18px]", isPhone && "flex-col gap-4")}>
              <div className={cn(isPhone ? "flex items-center gap-3" : "w-[120px] shrink-0")}>
                <img
                  src={posterUrl}
                  alt=""
                  className={cn(
                    "aspect-2/3 shrink-0 rounded-[2px] border border-[color:var(--line)] object-cover",
                    isPhone ? (isCompact ? "w-[26px]" : "w-[52px]") : "w-full",
                  )}
                />
                <div className={cn("min-w-0", !isPhone && "mt-2")}>
                  <p className={cn("display-4 leading-tight", isPhone && !isCompact && "text-lg")}>{title}</p>
                  {isCompact ? (
                    <p className="mono-meta text-muted-foreground">
                      {[rating !== null ? rating.toFixed(1) : null, liked ? "♥" : null].filter(Boolean).join(" · ")}
                    </p>
                  ) : (
                    <p className="mono-meta mt-0.5 text-muted-foreground">
                      {[year, subtitle].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-4">
                {isCompact ? null : (
                  <>
                    <LogEditorWhen isPhone={isPhone} when={when} />
                    <section>
                      <div className="mb-1 flex items-center justify-between">
                        <p className="kicker">Rating</p>
                        {isPhone ? null : likeButton}
                      </div>
                      <LaunchTrack value={rating} onCommit={onRatingChange} accentColor={accentColor} className="max-w-none" />
                    </section>
                    {isPhone ? likeButton : null}
                  </>
                )}

                <LogReviewField
                  isPhone={isPhone}
                  review={review}
                  maxLength={REVIEW_MAX_LENGTH}
                  onWritingChange={setIsWriting}
                />

                {formError ? (
                  <p role="alert" className="body-s rounded-[3px] border border-[color:var(--danger)]/50 bg-[color:var(--danger)]/10 px-3 py-2 text-[color:var(--danger)]">
                    {formError}
                  </p>
                ) : null}

                {isPhone && deleteLink ? <div className="pt-2">{deleteLink}</div> : null}
              </div>
            </div>
          </div>

          {isPhone ? null : (
            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[color:var(--line)] px-[18px] py-3">
              {deleteLink ?? <span />}
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || !canSubmit}>
                  {saveLabel}
                </Button>
              </div>
            </div>
          )}
        </form>
      </section>
    </ModalShell>
  );
};
