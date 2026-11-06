import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { deleteCurrentUserAccount } from "@/features/auth/api";
import { authKeys } from "@/features/auth/hooks/useAuth";
import { isApiError } from "@/lib/api-client";

// The server checks the current password before deleting anything (#136).
export const SettingsDeleteAccountCard = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isConfirming, setIsConfirming] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: deleteCurrentUserAccount,
    onSuccess: async () => {
      // Nothing cached belongs to anyone anymore.
      queryClient.clear();
      queryClient.setQueryData(authKeys.me, null);
      await navigate({ to: "/" });
    },
  });

  const closeDialog = () => {
    setIsConfirming(false);
    deleteMutation.reset();
  };

  return (
    <div className="border p-5 space-y-4 shell-border surface">
      <div>
        <p className="mb-1 text-base font-bold text-foreground">Delete account</p>
        <p className="text-sm shell-muted">
          Permanently deletes your account with its logs, reviews, lists, posts and comments.
          This can't be undone.
        </p>
      </div>

      <button
        type="button"
        onClick={() => setIsConfirming(true)}
        className="rounded-full border border-destructive/45 bg-destructive/10 px-5 py-2.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/15"
      >
        Delete account
      </button>

      <ConfirmDialog
        isOpen={isConfirming}
        context="Account · Delete"
        title="Delete account"
        description="This removes your logs, reviews, lists, posts and comments. It can't be undone."
        confirmLabel="Delete forever"
        cancelLabel="Keep account"
        isDestructive
        requirePassword
        isConfirming={deleteMutation.isPending}
        onConfirm={(password) => deleteMutation.mutate(password ?? "")}
        onClose={closeDialog}
        error={
          deleteMutation.isError
            ? isApiError(deleteMutation.error)
              ? deleteMutation.error.message
              : "Could not delete your account right now."
            : null
        }
      />
    </div>
  );
};
