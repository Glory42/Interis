import { useState } from "react";
import { Ban, CheckCircle2, KeyRound, ShieldCheck, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminConfirmDialog } from "@/features/admin/components/AdminConfirmDialog";
import { AdminDeleteUserAction } from "@/features/admin/components/AdminDeleteUserAction";
import { AdminPasswordField } from "@/features/admin/components/AdminPasswordField";
import type { AdminUser } from "@/features/admin/api";
import {
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
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    try {
      await resetPassword({ username, newPassword, adminPassword });
      setIsOpen(false);
      setNewPassword("");
      setAdminPassword("");
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
          setAdminPassword("");
          setError(null);
        }}
        title="Reset password"
        description={`Set a new password for @${username}. All of their sessions will be revoked.`}
        confirmLabel="Reset password"
        isLoading={isPending}
        isConfirmDisabled={newPassword.length < 8 || adminPassword.length === 0}
        error={error}
        onConfirm={() => void handleConfirm()}
      >
        <label className="block space-y-1 text-xs text-muted-foreground">
          <span>New password</span>
          <Input
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            type="password"
            autoComplete="new-password"
            className="h-8 text-sm"
          />
        </label>
        <AdminPasswordField value={adminPassword} onChange={setAdminPassword} />
      </AdminConfirmDialog>
    </>
  );
};

export const RoleAction = ({ user }: { user: AdminUser }) => {
  const { mutateAsync: promote, isPending: isPromoting } = usePromoteUser();
  const { mutateAsync: demote, isPending: isDemoting } = useDemoteUser();
  const [isOpen, setIsOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    try {
      const input = { username: user.username, adminPassword };
      if (user.isAdmin) {
        await demote(input);
      } else {
        await promote(input);
      }
      setIsOpen(false);
      setAdminPassword("");
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
        onClose={() => {
          setIsOpen(false);
          setAdminPassword("");
          setError(null);
        }}
        title={user.isAdmin ? "Remove admin access" : "Grant admin access"}
        description={
          user.isAdmin
            ? `Remove admin access from @${user.username}?`
            : `Grant admin access to @${user.username}? They will be able to manage users and content.`
        }
        confirmLabel={user.isAdmin ? "Demote" : "Promote"}
        variant={user.isAdmin ? "danger" : "default"}
        isLoading={isPromoting || isDemoting}
        isConfirmDisabled={adminPassword.length === 0}
        error={error}
        onConfirm={() => void handleConfirm()}
      >
        <AdminPasswordField value={adminPassword} onChange={setAdminPassword} />
      </AdminConfirmDialog>
    </>
  );
};

export const SuspendAction = ({ user }: { user: AdminUser }) => {
  const { mutateAsync: suspend, isPending: isSuspending } = useSuspendUser();
  const { mutateAsync: unsuspend, isPending: isUnsuspending } = useUnsuspendUser();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
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
      await suspend({ username: user.username, reason: reason.trim() || undefined, adminPassword });
      setIsOpen(false);
      setReason("");
      setAdminPassword("");
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
          setAdminPassword("");
          setError(null);
        }}
        title="Suspend account"
        description={`@${user.username} will be signed out and blocked from using the app.`}
        confirmLabel="Suspend"
        variant="danger"
        isLoading={isSuspending}
        isConfirmDisabled={adminPassword.length === 0}
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
        <AdminPasswordField value={adminPassword} onChange={setAdminPassword} />
      </AdminConfirmDialog>
    </>
  );
};

export const UserRowActions = ({
  user,
  viewerUsername,
}: {
  user: AdminUser;
  viewerUsername: string | undefined;
}) => {
  // Your own account is managed from settings, never from the admin panel.
  if (viewerUsername === user.username) {
    return null;
  }

  return (
    <div className="flex items-center gap-1">
      <ResetPasswordAction username={user.username} />
      <RoleAction user={user} />
      <SuspendAction user={user} />
      <AdminDeleteUserAction username={user.username} />
    </div>
  );
};
