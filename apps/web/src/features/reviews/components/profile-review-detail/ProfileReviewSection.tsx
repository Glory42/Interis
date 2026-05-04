import { Heart, Loader2, MessageSquare, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReviewDetail } from "@/features/reviews/api";
import { cn } from "@/lib/utils";

type ProfileReviewSectionProps = {
  detail: ReviewDetail;
  canReadSpoiler: boolean;
  onRevealSpoiler: () => void;
  likeBusy: boolean;
  onToggleLike: () => void;
};

export const ProfileReviewSection = ({
  detail,
  canReadSpoiler,
  onRevealSpoiler,
  likeBusy,
  onToggleLike,
}: ProfileReviewSectionProps) => {
  return (
    <section className="border border-border/60 bg-card/35 p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-foreground">Review</h2>
        <span className="text-xs text-muted-foreground">@{detail.author.username}</span>
      </div>

      {detail.containsSpoilers && !canReadSpoiler ? (
        <button
          type="button"
          className="inline-flex items-center gap-2 border border-amber-500/35 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-500/15"
          onClick={onRevealSpoiler}
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
          disabled={likeBusy}
          onClick={() => {
            void onToggleLike();
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
  );
};
