import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { deleteCurrentUserAccount } from "@/features/auth/api";
import { authKeys } from "@/features/auth/hooks/useAuth";
import { isApiError } from "@/lib/api-client";

type SettingsDeleteAccountCardProps = {
  username: string;
};

// Typing the username guards the one action here that can't be undone (#102).
export const SettingsDeleteAccountCard = ({ username }: SettingsDeleteAccountCardProps) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isConfirming, setIsConfirming] = useState(false);
  const [typedUsername, setTypedUsername] = useState("");

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
    setTypedUsername("");
    deleteMutation.reset();
  };

  return (
    <div className="border p-5 space-y-4 settings-shell-border settings-shell-panel">
      <div>
        <p className="mb-1 text-base font-bold text-foreground">Delete account</p>
        <p className="text-sm settings-shell-muted">
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
        variant="panel"
        title="Delete account"
        description={`Type your username, ${username}, to confirm.`}
        confirmLabel="Delete forever"
        loadingLabel="Deleting"
        isDestructive
        isConfirming={deleteMutation.isPending}
        isConfirmDisabled={typedUsername.trim() !== username}
        onConfirm={() => deleteMutation.mutate()}
        onClose={closeDialog}
        error={
          deleteMutation.isError
            ? isApiError(deleteMutation.error)
              ? deleteMutation.error.message
              : "Could not delete your account right now."
            : null
        }
      >
        <input
          aria-label="Your username"
          className="w-full rounded-lg border border-border/70 bg-transparent px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-destructive/60"
          value={typedUsername}
          onChange={(event) => setTypedUsername(event.target.value)}
          autoComplete="off"
        />
      </ConfirmDialog>
    </div>
  );
};
