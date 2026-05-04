import {
  formatDateLabel as formatDateLabelValue,
  formatRelativeTime as formatRelativeTimeValue,
} from "@/lib/time";

export const formatRelativeTime = (value: string): string => {
  return formatRelativeTimeValue(value);
};

export const formatDateLabel = (value: string): string => {
  return formatDateLabelValue(value);
};
