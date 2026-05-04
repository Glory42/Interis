import { toRatingTokens } from "./diary-model";

type DiaryRatingStarsProps = {
  ratingOutOfFive: number | null;
  color: string;
};

export const DiaryRatingStars = ({
  ratingOutOfFive,
  color,
}: DiaryRatingStarsProps) => {
  const tokens = toRatingTokens(ratingOutOfFive);
  const ratingLabel =
    ratingOutOfFive === null
      ? "Unrated"
      : Number.isInteger(ratingOutOfFive)
        ? `${ratingOutOfFive.toFixed(0)} stars`
        : `${ratingOutOfFive.toFixed(1)} stars`;

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
