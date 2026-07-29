import type { ReviewCardModuleStyles } from "@/features/media-archive/types";

type MediaReviewsEmptyStateProps = {
  message: string;
  moduleStyles: Pick<ReviewCardModuleStyles, "border" | "muted" | "panel">;
};

export const MediaReviewsEmptyState = ({ message, moduleStyles }: MediaReviewsEmptyStateProps) => (
  <div
    className="rounded-xl border p-4 font-mono text-xs"
    style={{
      borderColor: moduleStyles.border,
      color: moduleStyles.muted,
      background: moduleStyles.panel,
    }}
  >
    {message}
  </div>
);
