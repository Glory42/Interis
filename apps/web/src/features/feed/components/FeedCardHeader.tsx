import { Link } from "@tanstack/react-router";
import { getRelativeTime } from "@/features/feed/components/feed-row.utils";

type FeedCardHeaderProps = {
  username: string;
  displayName: string;
  createdAt: string;
};

// Shared "name · time" byline used by every feed card tier (timeline,
// review, post) so switching between them reads as one consistent feed.
export const FeedCardHeader = ({ username, displayName, createdAt }: FeedCardHeaderProps) => (
  <div className="flex flex-wrap items-baseline gap-1.5">
    <Link
      to="/profile/$username"
      params={{ username }}
      className="font-bold text-foreground hover:underline"
      style={{ fontFamily: "var(--theme-display-font)" }}
      viewTransition
    >
      {displayName}
    </Link>
    <span className="text-sm text-muted-foreground">· {getRelativeTime(createdAt)}</span>
  </div>
);
