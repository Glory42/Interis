import { useDeferredValue, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useAdminUsers } from "@/features/admin/hooks/useAdmin";
import { formatRelativeTime } from "@/lib/time";

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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
