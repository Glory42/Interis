import { formatRelativeTime as formatRelativeTimeLabel } from "@/lib/time";

export const formatRelativeTime = (value: string): string => {
  return formatRelativeTimeLabel(value);
};

export const toLanguageLabel = (languageCode: string | null): string | null => {
  if (!languageCode) {
    return null;
  }

  try {
    const displayNames = new Intl.DisplayNames(["en"], { type: "language" });
    return displayNames.of(languageCode) ?? languageCode.toUpperCase();
  } catch {
    return languageCode.toUpperCase();
  }
};

export const formatMoneyLabel = (value: number | null): string => {
  if (value === null || !Number.isFinite(value) || value <= 0) {
    return "Unknown";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
};
