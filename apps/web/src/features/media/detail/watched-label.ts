import { parseDateOnly } from "@/lib/time";

// "Watched Nov 2" this year, "Watched Mar 4, 2024" otherwise.
export const formatWatchedLabel = (watchedDate: string | null | undefined, now = new Date()): string | null => {
  if (!watchedDate) return null;
  const date = parseDateOnly(watchedDate);
  if (Number.isNaN(date.getTime())) return null;

  const sameYear = date.getFullYear() === now.getFullYear();
  const label = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  }).format(date);
  return `Watched ${label}`;
};
