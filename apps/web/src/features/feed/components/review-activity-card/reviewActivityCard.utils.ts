import { formatRelativeTime } from "@/lib/time";

export const getRelativeTime = (value: string): string => {
  return formatRelativeTime(value);
};
