import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteAdminDiaryEntry,
  deleteAdminPost,
  deleteAdminReview,
  listAdminDiaryEntries,
  listAdminPosts,
  listAdminReviews,
  type AdminContentFilters,
} from "@/features/admin/content-api";

export const adminContentKeys = {
  reviews: (filters: AdminContentFilters) => ["admin", "reviews", filters] as const,
  diary: (filters: AdminContentFilters) => ["admin", "diary", filters] as const,
  posts: (filters: Pick<AdminContentFilters, "username">) =>
    ["admin", "posts", filters] as const,
};

export const useAdminReviews = (filters: AdminContentFilters) =>
  useQuery({
    queryKey: adminContentKeys.reviews(filters),
    queryFn: () => listAdminReviews(filters),
  });

export const useAdminDiaryEntries = (filters: AdminContentFilters) =>
  useQuery({
    queryKey: adminContentKeys.diary(filters),
    queryFn: () => listAdminDiaryEntries(filters),
  });

export const useAdminPosts = (filters: Pick<AdminContentFilters, "username">) =>
  useQuery({
    queryKey: adminContentKeys.posts(filters),
    queryFn: () => listAdminPosts(filters),
  });

const useContentDelete = (mutationFn: (id: string) => Promise<void>, keyPrefix: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", keyPrefix] });
    },
  });
};

export const useDeleteAdminReview = () => useContentDelete(deleteAdminReview, "reviews");
export const useDeleteAdminDiaryEntry = () => useContentDelete(deleteAdminDiaryEntry, "diary");
export const useDeleteAdminPost = () => useContentDelete(deleteAdminPost, "posts");
