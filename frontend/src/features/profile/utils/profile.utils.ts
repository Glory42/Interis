import { formatRelativeTime } from "@/lib/time";
import type { PublicProfile } from "@/types/api";

const monthYearShortFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  year: "numeric",
});

const monthYearLongFormatter = new Intl.DateTimeFormat("en", {
  month: "long",
  year: "numeric",
});

export const getProfileDisplayName = (profile: PublicProfile): string => {
  return profile.displayUsername ?? profile.name ?? profile.username;
};

export const formatJoinedDate = (
  value: string | null | undefined,
  variant: "short" | "long" = "short",
): string => {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return variant === "long"
    ? monthYearLongFormatter.format(date)
    : monthYearShortFormatter.format(date);
};

export const getRelativeTime = (value: string | null | undefined): string => {
  if (!value) {
    return "No activity yet";
  }

  return formatRelativeTime(value, { maxUnit: "year" });
};
