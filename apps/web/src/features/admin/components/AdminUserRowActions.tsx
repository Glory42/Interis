import { useState } from "react";
import { Ban, CheckCircle2, KeyRound, ShieldCheck, ShieldOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminConfirmDialog } from "@/features/admin/components/AdminConfirmDialog";
import type { AdminUser } from "@/features/admin/api";
import {
  useDeleteUser,
  useDemoteUser,
  usePromoteUser,
  useResetUserPassword,
  useSuspendUser,
  useUnsuspendUser,
} from "@/features/admin/hooks/useAdmin";
import { isApiError } from "@/lib/api-client";

export const ResetPasswordAction = ({ username }: { username: string }) => {
  const { mutateAsync: resetPassword, isPending } = useResetUserPassword();
  const [isOpen, setIsOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    try {
      await resetPassword({ username, newPassword });
      setIsOpen(false);
      setNewPassword("");
    } catch (submitError) {
      setError(isApiError(submitError) ? submitError.message : "Could not reset password.");
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        title="Reset password"
        aria-label="Reset password"
        className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
        onClick={() => {
          setIsOpen(true);
          setError(null);
        }}
      >
        <KeyRound className="h-3.5 w-3.5" />
      </Button>
      <AdminConfirmDialog
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setNewPassword("");
          setError(null);
        }}
        title="Reset password"
        description={`Set a new password for @${username}. All of their sessions will be revoked.`}
        confirmLabel="Reset password"
        isLoading={isPending}
        isConfirmDisabled={newPassword.length < 8}
        error={error}
        onConfirm={() => void handleConfirm()}
      >
        <Input
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          placeholder="New password"
          type="text"
          className="h-8 text-sm"
        />
      </AdminConfirmDialog>
    </>
  );
};

export const RoleAction = ({ user }: { user: AdminUser }) => {
  const { mutateAsync: promote, isPending: isPromoting } = usePromoteUser();
  const { mutateAsync: demote, isPending: isDemoting } = useDemoteUser();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    try {
      if (user.isAdmin) {
        await demote(user.username);
      } else {
        await promote(user.username);
      }
      setIsOpen(false);
    } catch (submitError) {
      setError(isApiError(submitError) ? submitError.message : "Could not update role.");
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        title={user.isAdmin ? "Demote" : "Promote"}
        aria-label={user.isAdmin ? "Demote" : "Promote"}
        className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
        onClick={() => {
          setIsOpen(true);
          setError(null);
        }}
      >
        {user.isAdmin ? (
          <ShieldOff className="h-3.5 w-3.5" />
        ) : (
          <ShieldCheck className="h-3.5 w-3.5" />
        )}
      </Button>
      <AdminConfirmDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={user.isAdmin ? "Remove admin access" : "Grant admin access"}
        description={
          user.isAdmin
            ? `Remove admin access from @${user.username}?`
            : `Grant admin access to @${user.username}? They will be able to manage users and content.`
        }
        confirmLabel={user.isAdmin ? "Demote" : "Promote"}
        variant={user.isAdmin ? "danger" : "default"}
        isLoading={isPromoting || isDemoting}
        error={error}
        onConfirm={() => void handleConfirm()}
      />
    </>
  );
};

export const SuspendAction = ({ user }: { user: AdminUser }) => {
  const { mutateAsync: suspend, isPending: isSuspending } = useSuspendUser();
  const { mutateAsync: unsuspend, isPending: isUnsuspending } = useUnsuspendUser();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (user.isSuspended) {
    const handleUnsuspend = async () => {
      setError(null);
      try {
        await unsuspend(user.username);
        setIsOpen(false);
      } catch (submitError) {
        setError(isApiError(submitError) ? submitError.message : "Could not unsuspend.");
      }
    };

    return (
      <>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          title="Unsuspend"
          aria-label="Unsuspend"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
          onClick={() => {
            setIsOpen(true);
            setError(null);
          }}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
        </Button>
        <AdminConfirmDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Unsuspend account"
          description={`Restore access for @${user.username}?`}
          confirmLabel="Unsuspend"
          isLoading={isUnsuspending}
          error={error}
          onConfirm={() => void handleUnsuspend()}
        />
      </>
    );
  }

  const handleSuspend = async () => {
    setError(null);
    try {
      await suspend({ username: user.username, reason: reason.trim() || undefined });
      setIsOpen(false);
      setReason("");
    } catch (submitError) {
      setError(isApiError(submitError) ? submitError.message : "Could not suspend user.");
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        title="Suspend"
        aria-label="Suspend"
        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
        onClick={() => {
          setIsOpen(true);
          setError(null);
        }}
      >
        <Ban className="h-3.5 w-3.5" />
      </Button>
      <AdminConfirmDialog
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setReason("");
          setError(null);
        }}
        title="Suspend account"
        description={`@${user.username} will be signed out and blocked from using the app.`}
        confirmLabel="Suspend"
        variant="danger"
        isLoading={isSuspending}
        error={error}
        onConfirm={() => void handleSuspend()}
      >
        <Input
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Reason (optional)"
          type="text"
          className="h-8 text-sm"
        />
      </AdminConfirmDialog>
    </>
  );
};

export const DeleteUserAction = ({ username }: { username: string }) => {
  const { mutateAsync: deleteUser, isPending } = useDeleteUser();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (confirmText !== username) return;

    setError(null);
    try {
      await deleteUser(username);
      setIsOpen(false);
    } catch (submitError) {
      setError(isApiError(submitError) ? submitError.message : "Could not delete user.");
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        title="Delete"
        aria-label="Delete"
        className="h-7 w-7 p-0 text-destructive/80 hover:text-destructive"
        onClick={() => {
          setIsOpen(true);
          setError(null);
        }}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
      <AdminConfirmDialog
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setConfirmText("");
          setError(null);
        }}
        title="Delete account"
        description={`This permanently deletes @${username} and all of their diary entries, reviews, posts, and lists. This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={isPending}
        isConfirmDisabled={confirmText !== username}
        error={error}
        onConfirm={() => void handleDelete()}
      >
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            Type <span className="font-mono">{username}</span> to confirm:
          </p>
          <Input
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            placeholder={username}
            type="text"
            className="h-8 text-sm"
          />
        </div>
      </AdminConfirmDialog>
    </>
  );
};
