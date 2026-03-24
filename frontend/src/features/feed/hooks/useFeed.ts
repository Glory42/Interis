import { useQuery } from "@tanstack/react-query";
import { getFeedActivities } from "@/features/feed/api";

export const useFeed = () =>
  useQuery({
    queryKey: ["feed", "activities"],
    queryFn: getFeedActivities,
    enabled: false,
  });
