import type { ProfileTab } from "@/features/profile/components/ProfileTabs";

export const resolveActiveProfileTab = (
  pathname: string,
  username: string,
): ProfileTab => {
  const basePath = `/profile/${encodeURIComponent(username)}`;
  const suffix = pathname.startsWith(basePath)
    ? pathname.slice(basePath.length)
    : pathname;

  if (suffix === "" || suffix === "/") {
    return "overview";
  }

  if (suffix.startsWith("/diary")) {
    return "diary";
  }

  if (suffix.startsWith("/cinema") || suffix.startsWith("/films")) {
    return "cinema";
  }

  if (suffix.startsWith("/watchlist")) {
    return "watchlist";
  }

  if (suffix.startsWith("/liked")) {
    return "liked";
  }

  if (suffix.startsWith("/reviews")) {
    return "reviews";
  }

  if (suffix.startsWith("/lists")) {
    return "lists";
  }

  return "overview";
};
