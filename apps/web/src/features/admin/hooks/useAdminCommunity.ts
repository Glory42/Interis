import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteAdminActivity,
  deleteAdminList,
  listAdminActivities,
  listAdminLists,
  type AdminActivityFilters,
} from "@/features/admin/community-api";

export const adminCommunityKeys = {
  listsAll: ["admin", "lists"] as const,
  lists: (username?: string) => ["admin", "lists", username ?? ""] as const,
  activitiesAll: ["admin", "activities"] as const,
  activities: (filters: AdminActivityFilters) => ["admin", "activities", filters] as const,
};

const adminCommunityAllKeys = {
  lists: adminCommunityKeys.listsAll,
  activities: adminCommunityKeys.activitiesAll,
} as const;

export const useAdminLists = (username?: string) =>
  useQuery({
    queryKey: adminCommunityKeys.lists(username),
    queryFn: () => listAdminLists(username),
  });

export const useAdminActivities = (filters: AdminActivityFilters) =>
  useQuery({
    queryKey: adminCommunityKeys.activities(filters),
    queryFn: () => listAdminActivities(filters),
  });

const useCommunityDelete = (
  mutationFn: (id: string) => Promise<void>,
  keyPrefix: keyof typeof adminCommunityAllKeys,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminCommunityAllKeys[keyPrefix] });
    },
  });
};

export const useDeleteAdminList = () => useCommunityDelete(deleteAdminList, "lists");
export const useDeleteAdminActivity = () => useCommunityDelete(deleteAdminActivity, "activities");
