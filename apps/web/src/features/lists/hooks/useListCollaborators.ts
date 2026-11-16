import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { notificationKeys } from "@/features/notifications/hooks/useNotifications";
import { listKeys } from "@/features/lists/hooks/useLists";
import {
  acceptListInvite,
  inviteListCollaborator,
  removeListCollaborator,
  updateListItemNote,
  type ListDetail,
} from "@/features/lists/api";

// Joining or leaving a List changes its page and the viewer's Lists tab.
const invalidateMembership = (queryClient: QueryClient, listId: string, viewerUsername: string | undefined) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: listKeys.detail(listId) }),
    viewerUsername ? queryClient.invalidateQueries({ queryKey: listKeys.userLists(viewerUsername) }) : null,
  ]);

const invalidateNotifications = (queryClient: QueryClient) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: notificationKeys.list }),
    queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount }),
  ]);

export const useInviteListCollaborator = (listId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { errorToast: "Couldn't send the invite" },
    mutationFn: (username: string) => inviteListCollaborator(listId, username),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKeys.detail(listId) }),
  });
};

// The owner removing someone, or the viewer leaving a List they collaborate on.
export const useRemoveListCollaborator = (listId: string, viewerUsername: string | undefined) => {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { errorToast: "Couldn't update collaborators" },
    mutationFn: (userId: string) => removeListCollaborator(listId, userId),
    onSuccess: () => invalidateMembership(queryClient, listId, viewerUsername),
  });
};

export const useAcceptListInvite = (viewerUsername: string | undefined) => {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { errorToast: "Couldn't accept the invite" },
    mutationFn: (listId: string) => acceptListInvite(listId),
    onSuccess: (_data, listId) =>
      Promise.all([invalidateMembership(queryClient, listId, viewerUsername), invalidateNotifications(queryClient)]),
  });
};

export const useDeclineListInvite = (viewerId: string | undefined, viewerUsername: string | undefined) => {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { errorToast: "Couldn't decline the invite" },
    mutationFn: (listId: string) => removeListCollaborator(listId, viewerId ?? ""),
    onSuccess: (_data, listId) =>
      Promise.all([invalidateMembership(queryClient, listId, viewerUsername), invalidateNotifications(queryClient)]),
  });
};

export const useUpdateListItemNote = (listId: string) => {
  const queryClient = useQueryClient();
  const queryKey = listKeys.detail(listId);
  return useMutation({
    meta: { errorToast: "Couldn't save the note" },
    mutationFn: ({ itemId, note }: { itemId: string; note: string | null }) => updateListItemNote(listId, itemId, note),
    onSuccess: (saved) => {
      queryClient.setQueryData<ListDetail>(queryKey, (old) =>
        old ? { ...old, items: old.items.map((item) => (item.id === saved.id ? { ...item, note: saved.note } : item)) } : old,
      );
    },
  });
};
