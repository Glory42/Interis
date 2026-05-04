import { Link } from "@tanstack/react-router";
import { AlignLeft, Heart, RefreshCw } from "lucide-react";
import { feedChannelMeta } from "@/features/feed/components/feed-row.utils";
import { DiaryMediaLink } from "./DiaryMediaLink";
import { DiaryPosterCell } from "./DiaryPosterCell";
import { DiaryRatingStars } from "./DiaryRatingStars";
import { channelDisplayLabel, type DiaryRow as DiaryRowModel } from "./diary-model";

type DiaryRowProps = {
  row: DiaryRowModel;
  username: string;
};

export const DiaryRow = ({ row, username }: DiaryRowProps) => {
  const channelMeta = feedChannelMeta[row.channel];

  return (
    <div
      className="group grid grid-cols-[1fr] items-center gap-3 border-b px-2 py-3 transition-colors hover:bg-white/[0.015] md:grid-cols-[80px_48px_56px_1fr_80px_120px_32px_32px_32px]"
      style={{ borderColor: "var(--profile-shell-row-border)" }}
    >
      <div className="hidden md:flex">
        {row.showMonthCell ? (
          <div
            className="flex h-14 w-16 flex-col items-center justify-center border"
            style={{
              borderColor: "var(--profile-shell-border)",
              background:
                "color-mix(in srgb, var(--profile-shell-accent) 12%, var(--profile-shell-bg))",
            }}
          >
            <span className="font-mono text-[9px] font-bold uppercase tracking-widest profile-shell-accent">
              {row.dateParts.month}
            </span>
            <span className="font-mono text-[10px] profile-shell-muted">{row.dateParts.year}</span>
          </div>
        ) : (
          <div className="h-14 w-16" />
        )}
      </div>

      <div className="hidden md:block">
        <span className="font-mono text-xl font-bold profile-shell-muted">{row.dateParts.day}</span>
      </div>

      <div className="hidden md:block">
        <DiaryMediaLink row={row} className="block">
          <DiaryPosterCell title={row.title} posterPath={row.posterPath} />
        </DiaryMediaLink>
      </div>

      <div className="min-w-0">
        <div className="mb-1 flex items-center gap-2 md:hidden">
          <span className="font-mono text-[9px] uppercase tracking-widest profile-shell-accent">
            {row.dateParts.month} {row.dateParts.day}
          </span>
          <span
            className="border px-1.5 py-0.5 font-mono text-[9px]"
            style={{
              color: channelMeta.color,
              borderColor: `color-mix(in srgb, ${channelMeta.color} 38%, transparent)`,
            }}
          >
            {channelDisplayLabel[row.channel]}
          </span>
        </div>

        <DiaryMediaLink row={row} className="block truncate font-sans text-sm font-medium">
          <span style={{ color: "var(--profile-shell-fg)" }}>{row.title}</span>
        </DiaryMediaLink>

        <div className="mt-1 flex items-center gap-3 md:hidden">
          <DiaryRatingStars ratingOutOfFive={row.ratingOutOfFive} color={channelMeta.color} />
          <span className="font-mono text-[9px] profile-shell-muted">{row.releaseYear ?? "----"}</span>
          {row.reviewId ? (
            <Link
              to="/reviews/$username/$reviewId"
              params={{ username, reviewId: row.reviewId }}
              className="font-mono text-[9px] uppercase tracking-widest"
              style={{ color: channelMeta.color }}
              viewTransition
            >
              Review
            </Link>
          ) : null}
        </div>
      </div>

      <div className="hidden md:block">
        <span className="font-mono text-xs profile-shell-muted">{row.releaseYear ?? "----"}</span>
      </div>

      <div className="hidden items-center md:flex">
        <DiaryRatingStars ratingOutOfFive={row.ratingOutOfFive} color={channelMeta.color} />
      </div>

      <div className="hidden justify-center md:flex">
        <Heart
          className="h-3.5 w-3.5 transition-colors"
          style={{
            color: row.isLiked ? "var(--profile-shell-accent)" : "var(--profile-shell-muted)",
            fill: row.isLiked ? "var(--profile-shell-accent)" : "none",
          }}
          aria-label={row.isLiked ? "Liked" : "Like"}
        />
      </div>

      <div className="hidden justify-center md:flex">
        {row.rewatch ? (
          <RefreshCw className="h-3 w-3" style={{ color: channelMeta.color }} aria-label="Rewatch" />
        ) : (
          <div className="h-3 w-3" />
        )}
      </div>

      <div className="hidden justify-center md:flex">
        {row.hasReview && row.reviewId ? (
          <Link
            to="/reviews/$username/$reviewId"
            params={{ username, reviewId: row.reviewId }}
            className="inline-flex"
            viewTransition
          >
            <AlignLeft className="h-3 w-3" style={{ color: channelMeta.color }} aria-label="Has review" />
          </Link>
        ) : (
          <div className="h-3 w-3" />
        )}
      </div>
    </div>
  );
};
