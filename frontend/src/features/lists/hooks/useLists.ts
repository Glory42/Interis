import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { profileKeys } from "@/features/profile/hooks/useProfile";
import {
  addListItem,
  createList,
  deleteList,
  getListDetail,
  getUserLists,
  getUserListsForItem,
  likeList,
  removeListItem,
  reorderListItems,
  unlikeList,
  updateList,
} from "@/features/lists/api";

export const listKeys = {
  all: ["lists"] as const,
  userLists: (username: string) => ["lists", "user", username] as const,
  userListsForItem: (username: string, tmdbId: number, itemType: string) =>
    ["lists", "user", username, "item", tmdbId, itemType] as const,
  detail: (listId: string) => ["lists", "detail", listId] as const,
};

export const useUserLists = (username: string, enabled = true) =>
  useQuery({
    queryKey: listKeys.userLists(username),
    queryFn: ({ signal }) => getUserLists(username, { signal }),
    enabled: enabled && username.trim().length > 0,
  });

export const useUserListsForItem = (
  username: string,
  tmdbId: number,
  itemType: "cinema" | "serial",
  enabled = true,
) =>
  useQuery({
    queryKey: listKeys.userListsForItem(username, tmdbId, itemType),
    queryFn: ({ signal }) =>
      getUserListsForItem(username, tmdbId, itemType, { signal }),
    enabled: enabled && username.trim().length > 0 && tmdbId > 0,
  });

export const useListDetail = (listId: string, enabled = true) =>
  useQuery({
    queryKey: listKeys.detail(listId),
    queryFn: ({ signal }) => getListDetail(listId, { signal }),
    enabled: enabled && listId.trim().length > 0,
  });

export const useCreateList = (ownerUsername: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createList,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: listKeys.userLists(ownerUsername),
        }),
        queryClient.invalidateQueries({
          queryKey: profileKeys.detail(ownerUsername),
        }),
      ]);
    },
  });
};

export const useUpdateList = (listId: string, ownerUsername: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof updateList>[1]) =>
      updateList(listId, data),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: listKeys.detail(listId) }),
        queryClient.invalidateQueries({
          queryKey: listKeys.userLists(ownerUsername),
        }),
      ]);
    },
  });
};

export const useDeleteList = (listId: string, ownerUsername: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteList(listId),
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: listKeys.detail(listId) });
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: listKeys.userLists(ownerUsername),
        }),
        queryClient.invalidateQueries({
          queryKey: profileKeys.detail(ownerUsername),
        }),
      ]);
    },
  });
};

export const useAddListItem = (listId: string, ownerUsername: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { tmdbId: number; itemType: "cinema" | "serial" }) =>
      addListItem(listId, data),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: listKeys.detail(listId) }),
        queryClient.invalidateQueries({
          queryKey: listKeys.userLists(ownerUsername),
        }),
        queryClient.invalidateQueries({
          queryKey: ["lists", "user", ownerUsername, "item"],
          exact: false,
        }),
      ]);
    },
  });
};

export const useRemoveListItem = (listId: string, ownerUsername: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => removeListItem(listId, itemId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: listKeys.detail(listId) }),
        queryClient.invalidateQueries({
          queryKey: listKeys.userLists(ownerUsername),
        }),
        queryClient.invalidateQueries({
          queryKey: ["lists", "user", ownerUsername, "item"],
          exact: false,
        }),
      ]);
    },
  });
};

export const useReorderListItems = (listId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: Array<{ id: string; position: number }>) =>
      reorderListItems(listId, items),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: listKeys.detail(listId),
      });
    },
  });
};

export const useLikeList = (listId: string, viewerUsername?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => likeList(listId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: listKeys.detail(listId) });
      if (viewerUsername) {
        await queryClient.invalidateQueries({
          queryKey: ["profile", "liked-lists", viewerUsername],
        });
      }
    },
  });
};

export const useUnlikeList = (listId: string, viewerUsername?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => unlikeList(listId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: listKeys.detail(listId) });
      if (viewerUsername) {
        await queryClient.invalidateQueries({
          queryKey: ["profile", "liked-lists", viewerUsername],
        });
      }
    },
  });
};

export const useToggleListItem = (
  ownerUsername: string,
  tmdbId: number,
  itemType: "cinema" | "serial",
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      listId,
      entryId,
    }: {
      listId: string;
      entryId: string | null | undefined;
    }): Promise<void> => {
      if (entryId) {
        await removeListItem(listId, entryId);
      } else {
        await addListItem(listId, { tmdbId, itemType });
      }
    },
    onSuccess: async (_data, { listId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: listKeys.detail(listId) }),
        queryClient.invalidateQueries({
          queryKey: listKeys.userLists(ownerUsername),
        }),
        queryClient.invalidateQueries({
          queryKey: listKeys.userListsForItem(ownerUsername, tmdbId, itemType),
        }),
      ]);
    },
  });
};
