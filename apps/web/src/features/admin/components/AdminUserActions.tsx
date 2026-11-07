import { useState } from "react";
import type { UseMutationResult } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { AdminDeleteUserAction } from "@/features/admin/components/AdminDeleteUserAction";
import { AdminSuspendDialog } from "@/features/admin/components/AdminSuspendDialog";
import { useDemote, useForceReset, useLiftSuspension, usePromote, useRevokeSessions } from "@/features/admin/hooks/useAdminUserDetail";
import type { AdminUserDetail } from "@/features/admin/user-detail-api";
import { isApiError } from "@/lib/api-client";

type PasswordInput = { username: string; adminPassword: string };

// One button whose action runs only after the admin re-enters their own password.
const PasswordAction = ({
  username,
  label,
  description,
  mutation,
  isDestructive = false,
}: {
  username: string;
  label: string;
  description: string;
  mutation: UseMutationResult<void, Error, PasswordInput>;
  isDestructive?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const title = label.replace("…", "");
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setIsOpen(true)}>
        {label}
      </Button>
      <ConfirmDialog
        isOpen={isOpen}
        context={`${title} · @${username}`}
        title={`${title} for @${username}?`}
        description={description}
        confirmLabel={title}
        isDestructive={isDestructive}
        requirePassword
        isConfirming={mutation.isPending}
        error={mutation.isError ? (isApiError(mutation.error) ? mutation.error.message : "That didn't go through.") : null}
        onClose={() => {
          setIsOpen(false);
          mutation.reset();
        }}
        onConfirm={(adminPassword) => mutation.mutate({ username, adminPassword: adminPassword ?? "" }, { onSuccess: () => setIsOpen(false) })}
      />
    </>
  );
};

export const AdminUserActions = ({ user }: { user: AdminUserDetail["user"] }) => {
  const [isSuspending, setIsSuspending] = useState(false);
  const lift = useLiftSuspension();
  const revoke = useRevokeSessions();
  const forceReset = useForceReset();
  const promote = usePromote();
  const demote = useDemote();

  return (
    <div className="flex flex-wrap gap-2">
      {user.isSuspended ? (
        <Button size="sm" variant="outline" disabled={lift.isPending} onClick={() => lift.mutate({ username: user.username })}>
          Lift suspension
        </Button>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setIsSuspending(true)}>
          Suspend…
        </Button>
      )}
      <PasswordAction username={user.username} label="Revoke sessions" description="Signs them out on every device. Their account stays as it is." mutation={revoke} />
      <PasswordAction
        username={user.username}
        label="Force reset"
        description="Signs them out everywhere and makes them set a new password through their recovery question."
        mutation={forceReset}
      />
      {user.isAdmin ? (
        <PasswordAction username={user.username} label="Remove admin…" description="They lose access to the admin console." mutation={demote} isDestructive />
      ) : (
        <PasswordAction username={user.username} label="Make admin…" description="They can moderate reports, users and content." mutation={promote} />
      )}
      <AdminDeleteUserAction username={user.username} />
      {isSuspending ? <AdminSuspendDialog username={user.username} onClose={() => setIsSuspending(false)} /> : null}
    </div>
  );
};
