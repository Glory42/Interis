import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import type { SerialDetailResponse } from "@/features/serials/api";
import { SpaceRatingDisplay } from "@/features/films/components/SpaceRating";
import { formatRatingOutOfFiveLabel } from "@/features/films/components/spaceRating.utils";
import { SERIAL_MODULE_STYLES } from "@/features/serials/components/serial-detail/styles";
import { formatRelativeTime } from "@/features/serials/components/serial-detail/utils";

type SerialReviewCardProps = {
  review: SerialDetailResponse["reviews"][number];
};

export const SerialReviewCard = ({ review }: SerialReviewCardProps) => {
  const authorName = review.author.displayUsername ?? review.author.username;
  const avatarUrl = review.author.avatarUrl ?? review.author.image;

  return (
    <article
      className="border p-4"
      style={{
        borderColor: SERIAL_MODULE_STYLES.border,
        background: SERIAL_MODULE_STYLES.panel,
      }}
    >
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`${review.author.username} avatar`}
              className="h-9 w-9 border object-cover"
              style={{ borderColor: SERIAL_MODULE_STYLES.border }}
            />
          ) : (
            <span
              className="inline-flex h-9 w-9 items-center justify-center border font-mono text-xs"
              style={{
                borderColor: SERIAL_MODULE_STYLES.border,
                color: SERIAL_MODULE_STYLES.text,
                background: SERIAL_MODULE_STYLES.panelElevated,
              }}
            >
              {review.author.username.slice(0, 1).toUpperCase()}
            </span>
          )}

          <div>
            <Link
              to="/profile/$username"
              params={{ username: review.author.username }}
              className="font-mono text-xs font-bold"
              style={{ color: SERIAL_MODULE_STYLES.text }}
              viewTransition
            >
              {authorName}
            </Link>

            <div className="mt-0.5 flex items-center gap-2">
              <SpaceRatingDisplay ratingOutOfFive={review.ratingOutOfFive} size="sm" />
              <span
                className="font-mono text-[10px]"
                style={{ color: SERIAL_MODULE_STYLES.faint }}
              >
                {formatRatingOutOfFiveLabel(review.ratingOutOfFive) ?? "Unrated"}
              </span>
              <span
                className="font-mono text-[10px]"
                style={{ color: SERIAL_MODULE_STYLES.faint }}
              >
                {formatRelativeTime(review.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <span
          className="inline-flex items-center gap-1 font-mono text-[10px]"
          style={{
            color: review.viewerHasLiked
              ? SERIAL_MODULE_STYLES.accent
              : SERIAL_MODULE_STYLES.faint,
          }}
        >
          <Heart className="h-3 w-3" />
          {review.likeCount}
        </span>
      </div>

      {review.containsSpoilers ? (
        <p
          className="mb-2 inline-flex border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em]"
          style={{
            borderColor: SERIAL_MODULE_STYLES.accent,
            color: SERIAL_MODULE_STYLES.accent,
            background: SERIAL_MODULE_STYLES.badge,
          }}
        >
          Spoilers
        </p>
      ) : null}

      <p
        className="whitespace-pre-wrap text-sm leading-relaxed"
        style={{ color: SERIAL_MODULE_STYLES.muted }}
      >
        {review.content}
      </p>

      <div
        className="mt-3 border-t pt-3"
        style={{ borderColor: SERIAL_MODULE_STYLES.borderSoft }}
      >
        <Link
          to="/reviews/$username/$reviewId"
          params={{
            username: review.author.username,
            reviewId: review.id,
          }}
          className="font-mono text-[10px] uppercase tracking-[0.16em]"
          style={{ color: SERIAL_MODULE_STYLES.faint }}
          viewTransition
        >
          Open full review thread
        </Link>
      </div>
    </article>
  );
};
