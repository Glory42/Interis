import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminPagedList } from "@/features/admin/hooks/useAdminPagedList";
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
  reviewsAll: ["admin", "reviews"] as const,
  reviews: (filters: AdminContentFilters) => ["admin", "reviews", filters] as const,
  diaryAll: ["admin", "diary"] as const,
  diary: (filters: AdminContentFilters) => ["admin", "diary", filters] as const,
  postsAll: ["admin", "posts"] as const,
  posts: (filters: Pick<AdminContentFilters, "username">) =>
    ["admin", "posts", filters] as const,
};

const adminContentAllKeys = {
  reviews: adminContentKeys.reviewsAll,
  diary: adminContentKeys.diaryAll,
  posts: adminContentKeys.postsAll,
} as const;

export const useAdminReviews = (filters: AdminContentFilters) =>
  useAdminPagedList(adminContentKeys.reviews(filters), (page) => listAdminReviews(filters, page));

export const useAdminDiaryEntries = (filters: AdminContentFilters) =>
  useAdminPagedList(adminContentKeys.diary(filters), (page) =>
    listAdminDiaryEntries(filters, page),
  );

export const useAdminPosts = (filters: Pick<AdminContentFilters, "username">) =>
  useAdminPagedList(adminContentKeys.posts(filters), (page) => listAdminPosts(filters, page));

const useContentDelete = (
  mutationFn: (id: string) => Promise<void>,
  keyPrefix: keyof typeof adminContentAllKeys,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminContentAllKeys[keyPrefix] });
    },
  });
};

export const useDeleteAdminReview = () => useContentDelete(deleteAdminReview, "reviews");
export const useDeleteAdminDiaryEntry = () => useContentDelete(deleteAdminDiaryEntry, "diary");
export const useDeleteAdminPost = () => useContentDelete(deleteAdminPost, "posts");
