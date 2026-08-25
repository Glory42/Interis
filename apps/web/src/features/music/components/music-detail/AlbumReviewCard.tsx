import type { MusicDetailResponse } from "@/features/music/api";
import { MUSIC_MODULE_STYLES } from "@/features/music/components/music-detail/styles";

type AlbumReviewCardProps = {
  review: MusicDetailResponse["reviews"][number];
};

export const AlbumReviewCard = ({ review }: AlbumReviewCardProps) => {
  const authorName = review.author.displayUsername ?? review.author.username;

  return (
    <div
      className="border p-4"
      style={{
        borderColor: MUSIC_MODULE_STYLES.border,
        background: MUSIC_MODULE_STYLES.panel,
      }}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10px]" style={{ color: MUSIC_MODULE_STYLES.accent }}>
          {authorName}
        </span>
        {review.rating !== null ? (
          <span
            className="border px-2 py-0.5 font-mono text-[9px]"
            style={{
              borderColor: MUSIC_MODULE_STYLES.borderSoft,
              color: MUSIC_MODULE_STYLES.faint,
            }}
          >
            {review.rating.toFixed(1)} / 10
          </span>
        ) : null}
        {review.containsSpoilers ? (
          <span
            className="border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em]"
            style={{
              borderColor: MUSIC_MODULE_STYLES.borderSoft,
              color: MUSIC_MODULE_STYLES.faint,
            }}
          >
            spoilers
          </span>
        ) : null}
        <span
          className="ml-auto font-mono text-[9px]"
          style={{ color: MUSIC_MODULE_STYLES.faint }}
        >
          {review.likeCount} {review.likeCount === 1 ? "like" : "likes"}
        </span>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: MUSIC_MODULE_STYLES.muted }}>
        {review.content}
      </p>
    </div>
  );
};
