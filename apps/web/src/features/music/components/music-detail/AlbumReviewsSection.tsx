import type { MusicDetailResponse, MusicDetailReviewSort } from "@/features/music/api";
import { AlbumReviewCard } from "@/features/music/components/music-detail/AlbumReviewCard";
import { MUSIC_MODULE_STYLES } from "@/features/music/components/music-detail/styles";

type AlbumReviewsSectionProps = {
  reviewsSort: MusicDetailReviewSort;
  onSortChange: (nextSort: MusicDetailReviewSort) => void;
  reviews: MusicDetailResponse["reviews"];
};

export const AlbumReviewsSection = ({
  reviewsSort,
  onSortChange,
  reviews,
}: AlbumReviewsSectionProps) => {
  return (
    <section className="mt-10">
      <div
        className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b pb-4"
        style={{ borderColor: MUSIC_MODULE_STYLES.borderSoft }}
      >
        <h2
          className="font-mono text-lg font-bold"
          style={{ color: MUSIC_MODULE_STYLES.text }}
        >
          Reviews
        </h2>

        <div className="flex gap-2">
          {(["popular", "recent"] as const).map((sort) => (
            <button
              key={sort}
              type="button"
              className="border px-3 py-1.5 font-mono text-[10px] transition-all"
              style={{
                borderColor:
                  reviewsSort === sort
                    ? MUSIC_MODULE_STYLES.accent
                    : MUSIC_MODULE_STYLES.borderSoft,
                color:
                  reviewsSort === sort ? MUSIC_MODULE_STYLES.accent : MUSIC_MODULE_STYLES.faint,
                background:
                  reviewsSort === sort
                    ? "color-mix(in srgb, var(--module-music) 8%, transparent)"
                    : "transparent",
              }}
              onClick={() => onSortChange(sort)}
            >
              {sort.charAt(0).toUpperCase() + sort.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {reviews.length === 0 ? (
        <div
          className="border p-4 font-mono text-xs"
          style={{
            borderColor: MUSIC_MODULE_STYLES.border,
            color: MUSIC_MODULE_STYLES.muted,
            background: MUSIC_MODULE_STYLES.panel,
          }}
        >
          No reviews yet for this album.
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <AlbumReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </section>
  );
};
