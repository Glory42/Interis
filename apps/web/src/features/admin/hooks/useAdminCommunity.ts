import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteAdminActivity,
  deleteAdminList,
  listAdminActivities,
  listAdminLists,
  type AdminActivityFilters,
} from "@/features/admin/community-api";

export const adminCommunityKeys = {
  lists: (username?: string) => ["admin", "lists", username ?? ""] as const,
  activities: (filters: AdminActivityFilters) => ["admin", "activities", filters] as const,
};

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

const useCommunityDelete = (mutationFn: (id: string) => Promise<void>, keyPrefix: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", keyPrefix] });
    },
  });
};

export const useDeleteAdminList = () => useCommunityDelete(deleteAdminList, "lists");
export const useDeleteAdminActivity = () => useCommunityDelete(deleteAdminActivity, "activities");
