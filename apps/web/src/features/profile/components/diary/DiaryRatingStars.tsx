import { formatRatingLabel } from "@/lib/rating";
import { toRatingTokens } from "./diary-model";

type DiaryRatingStarsProps = {
  rating: number | null;
  color: string;
};

export const DiaryRatingStars = ({
  rating,
  color,
}: DiaryRatingStarsProps) => {
  const tokens = toRatingTokens(rating);
  const ratingLabel = formatRatingLabel(rating) ?? "Unrated";

  return (
    <span className="flex items-center gap-0.5" aria-label={ratingLabel}>
      {tokens.map((token, index) => {
        if (token === "full") {
          return (
            <span key={`diary-rating-full-${index}`} style={{ color, fontSize: 11 }}>
              ★
            </span>
          );
        }

        if (token === "half") {
          return (
            <span key={`diary-rating-half-${index}`} style={{ color, fontSize: 11 }}>
              ½
            </span>
          );
        }

        return (
          <span
            key={`diary-rating-empty-${index}`}
            style={{ color: "var(--profile-shell-muted)", fontSize: 11 }}
          >
            ★
          </span>
        );
      })}
    </span>
  );
};
