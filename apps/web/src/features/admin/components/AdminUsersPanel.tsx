import { useDeferredValue, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useAdminUsers, useResetUserPassword } from "@/features/admin/hooks/useAdmin";
import { isApiError } from "@/lib/api-client";
import { formatRelativeTime } from "@/lib/time";

const ResetPasswordAction = ({ username }: { username: string }) => {
  const { mutateAsync: resetPassword, isPending } = useResetUserPassword();
  const [isOpen, setIsOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) {
    return (
      <button
        type="button"
        className="text-xs text-muted-foreground hover:text-primary"
        onClick={() => {
          setIsOpen(true);
          setSuccess(false);
          setError(null);
        }}
      >
        Reset password
      </button>
    );
  }

  const handleSubmit = async () => {
    setError(null);
    try {
      await resetPassword({ username, newPassword });
      setSuccess(true);
      setNewPassword("");
    } catch (submitError) {
      setError(isApiError(submitError) ? submitError.message : "Could not reset password.");
    }
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex items-center gap-1.5">
        <Input
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          placeholder="New password"
          type="text"
          className="h-7 w-36 text-xs"
        />
        <Button
          type="button"
          size="sm"
          className="h-7 px-2 text-xs"
          disabled={isPending || newPassword.length < 8}
          onClick={() => void handleSubmit()}
        >
          {isPending ? "..." : "Confirm"}
        </Button>
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={() => {
            setIsOpen(false);
            setNewPassword("");
            setError(null);
          }}
        >
          Cancel
        </button>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {success ? <p className="text-xs text-muted-foreground">Password reset — all sessions revoked.</p> : null}
    </div>
  );
};

export const AdminUsersPanel = () => {
  const [queryInput, setQueryInput] = useState("");
  const deferredQuery = useDeferredValue(queryInput.trim());
  const usersQuery = useAdminUsers(deferredQuery.length > 0 ? deferredQuery : undefined);

  return (
    <div className="space-y-4">
      <Input
        value={queryInput}
        onChange={(event) => setQueryInput(event.target.value)}
        placeholder="Search by username..."
        className="max-w-sm"
      />

      {usersQuery.isPending ? (
        <div className="flex items-center justify-center py-10">
          <Spinner />
        </div>
      ) : usersQuery.isError ? (
        <p className="text-sm text-muted-foreground">Could not load users.</p>
      ) : usersQuery.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No users found.</p>
      ) : (
        <div className="border border-border/60">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Joined</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersQuery.data.map((adminUser) => (
                <tr key={adminUser.id} className="border-b border-border/40 last:border-0">
                  <td className="px-3 py-2">
                    <Link
                      to="/profile/$username"
                      params={{ username: adminUser.username }}
                      className="text-primary hover:underline"
                    >
                      @{adminUser.username}
                    </Link>
                    {adminUser.displayUsername ? (
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({adminUser.displayUsername})
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{adminUser.email}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {formatRelativeTime(adminUser.createdAt.toISOString())}
                  </td>
                  <td className="px-3 py-2">
                    {adminUser.isAdmin ? <Badge>Admin</Badge> : null}
                  </td>
                  <td className="px-3 py-2">
                    <ResetPasswordAction username={adminUser.username} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
