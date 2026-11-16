import { useQuery } from "@tanstack/react-query";
import { getYearReview } from "@/features/year-review/api";

export const yearReviewKeys = {
  detail: (username: string, year: number) => ["year-review", username, year] as const,
};

export const useYearReview = (username: string, year: number) =>
  useQuery({
    queryKey: yearReviewKeys.detail(username, year),
    queryFn: ({ signal }) => getYearReview(username, year, { signal }),
    enabled: username.trim().length > 0,
  });
