import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useAcceptListInvite, useDeclineListInvite } from "@/features/lists/hooks/useListCollaborators";

// Shown to a pending invitee on the List itself, next to the same actions the notification offers.
export const ListInviteBanner = ({ listId, ownerUsername }: { listId: string; ownerUsername: string }) => {
  const { user } = useAuth();
  const acceptMutation = useAcceptListInvite(user?.username);
  const declineMutation = useDeclineListInvite(user?.id, user?.username);
  const isPending = acceptMutation.isPending || declineMutation.isPending;

  return (
    <div role="region" aria-label="List invite" className="surface-card mb-4 flex flex-wrap items-center justify-between gap-3 p-3">
      <p className="body-s text-foreground">{`${ownerUsername} invited you to edit this list with them.`}</p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={isPending} onClick={() => declineMutation.mutate(listId)}>
          Decline
        </Button>
        <Button size="sm" disabled={isPending} onClick={() => acceptMutation.mutate(listId)}>
          Accept
        </Button>
      </div>
    </div>
  );
};
