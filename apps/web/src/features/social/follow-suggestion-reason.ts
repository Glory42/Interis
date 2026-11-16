import type { FollowSuggestion } from "@/features/social/api";

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

// Why someone is suggested, most specific first.
export const formatSuggestionReason = (
  suggestion: Pick<FollowSuggestion, "sharedCount" | "agreeTitle" | "followerCount">,
): string => {
  const { sharedCount, agreeTitle, followerCount } = suggestion;
  if (agreeTitle && sharedCount > 1) return `Agrees on ${agreeTitle} · ${plural(sharedCount, "title")} in common`;
  if (agreeTitle) return `Agrees on ${agreeTitle}`;
  if (sharedCount === 1) return "Watched one of your titles";
  if (sharedCount > 1) return `Watched ${sharedCount} of your titles`;
  if (followerCount > 0) return `Popular on Interis · ${plural(followerCount, "follower")}`;
  return "Active on Interis";
};
