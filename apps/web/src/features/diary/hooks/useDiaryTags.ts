import { useQuery } from "@tanstack/react-query";
import { getLogPrivateFields, getUserDiaryTags } from "@/features/diary/api";
import { diaryKeys } from "@/features/diary/hooks/diary-keys";
import { profileKeys } from "@/features/profile/hooks/useProfile";

// One bounded list serves both the profile's Tags overview and the editor's suggestions.
export const DIARY_TAGS_LIMIT = 50;

export const useUserDiaryTags = (username: string | null | undefined) =>
  useQuery({
    queryKey: profileKeys.diaryTags(username ?? ""),
    queryFn: ({ signal }) => getUserDiaryTags(username ?? "", DIARY_TAGS_LIMIT, { signal }),
    enabled: Boolean(username),
  });

// The viewer's own log's note and tags, for an editor opened without them.
export const useLogPrivateFields = (kind: "film" | "tv", logId: string, enabled: boolean) =>
  useQuery({
    queryKey: diaryKeys.privateFields(kind, logId),
    queryFn: ({ signal }) => getLogPrivateFields(kind, logId, { signal }),
    enabled,
  });
