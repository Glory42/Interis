import { Link } from "@tanstack/react-router";
import { CalendarDays, Clock3, Heart, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReviewDetail } from "@/features/reviews/api";
import {
  formatDateLabel,
  formatRelativeTime,
} from "@/features/reviews/components/profile-review-detail/utils";

type ProfileReviewSidebarProps = {
  detail: ReviewDetail;
};

export const ProfileReviewSidebar = ({ detail }: ProfileReviewSidebarProps) => {
  return (
    <aside className="space-y-8 lg:col-span-4">
      <section className="border border-border/60 bg-card/35 p-5">
        <h2 className="mb-5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          Review Stats
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="h-3 w-3" />
              Published
            </span>
            <span className="font-medium text-foreground">{formatDateLabel(detail.createdAt)}</span>
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
            <span className="font-medium text-foreground">{detail.engagement.likeCount}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              Comments
            </span>
            <span className="font-medium text-foreground">{detail.engagement.commentCount}</span>
          </div>
        </div>
      </section>

      <section className="border border-border/60 bg-card/35 p-5">
        <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          Watch Page
        </h2>

        {detail.mediaType === "tv" ? (
          <Button asChild variant="outline" className="w-full">
            <Link to="/serials/$tmdbId" params={{ tmdbId: String(detail.media.tmdbId) }}>
              Open series page
            </Link>
          </Button>
        ) : (
          <Button asChild variant="outline" className="w-full">
            <Link to="/cinema/$tmdbId" params={{ tmdbId: String(detail.media.tmdbId) }}>
              Open film page
            </Link>
          </Button>
        )}
      </section>
    </aside>
  );
};
