import { useQuery } from "@tanstack/react-query";
import { getMyFilmLogs } from "@/features/diary/api";
import { diaryKeys } from "@/features/diary/hooks/diary-keys";

export { diaryKeys };

// Creating, editing and deleting a log go through the Log Editor (features/media/log-editor).
export const useMyFilmLogs = () =>
  useQuery({
    queryKey: diaryKeys.myLogs,
    queryFn: getMyFilmLogs,
  });
