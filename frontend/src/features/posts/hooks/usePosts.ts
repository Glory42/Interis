import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPost, type CreatePostInput } from "@/features/posts/api";
import { feedKeys } from "@/features/feed/hooks/useFeed";

export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePostInput) => createPost(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: feedKeys.following });
    },
  });
};
