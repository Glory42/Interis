import { memo } from "react";
import { FeedActivityCard } from "@/features/feed/components/FeedActivityCard";
import { FeedCompactRow } from "@/features/feed/components/FeedCompactRow";
import { EpisodesCard, FollowsLine, TitlesLine } from "@/features/feed/components/FeedFoldedRows";
import { FeedTitleCard } from "@/features/feed/components/FeedTitleCard";
import type { FeedRow } from "@/features/feed/types";

type FeedRowViewProps = {
  row: FeedRow;
  // "compact" is the profile overview's smaller row.
  variant?: "card" | "compact";
};

// One row of the Following Feed or the profile overview, as the API folded it.
export const FeedRowView = memo(function FeedRowView({ row, variant = "card" }: FeedRowViewProps) {
  if (variant === "compact") return <FeedCompactRow row={row} />;

  switch (row.kind) {
    case "title":
      return <FeedTitleCard group={row.group} day={row.day} />;
    case "titles":
      return <TitlesLine row={row} />;
    case "follows":
      return <FollowsLine row={row} />;
    case "episodes":
      return <EpisodesCard row={row} />;
    default:
      return <FeedActivityCard item={row.item} />;
  }
});
