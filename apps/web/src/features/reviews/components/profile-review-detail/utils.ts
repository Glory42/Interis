import { formatRelativeTime as formatRelativeTimeValue } from "@/lib/time";

export const formatRelativeTime = (value: string): string => {
  return formatRelativeTimeValue(value);
};
