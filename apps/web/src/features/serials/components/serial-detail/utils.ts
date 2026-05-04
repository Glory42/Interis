import {
  formatDateLabel,
  formatRelativeTime as formatRelativeTimeLabel,
} from "@/lib/time";

export const toDateLabel = (value: string | null): string | null => {
  if (!value) {
    return null;
  }

  return formatDateLabel(value);
};

export const formatRelativeTime = (value: string): string => {
  return formatRelativeTimeLabel(value);
};

export const toEpisodeCodeLabel = (episodeNumber: number): string => {
  return `E${String(episodeNumber).padStart(2, "0")}`;
};

export const toYearFromDateLabel = (value: string | null): string => {
  if (!value || value.length < 4) {
    return "Year unknown";
  }

  return value.slice(0, 4);
};
