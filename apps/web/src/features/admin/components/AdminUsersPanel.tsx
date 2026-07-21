import { useDeferredValue, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { AdminPanelHeader } from "@/features/admin/components/AdminPanelHeader";
import { AdminPanelState } from "@/features/admin/components/AdminPanelState";
import { AdminSearchInput } from "@/features/admin/components/AdminSearchInput";
import {
  DeleteUserAction,
  ResetPasswordAction,
  RoleAction,
  SuspendAction,
} from "@/features/admin/components/AdminUserRowActions";
import { useAdminUsers } from "@/features/admin/hooks/useAdmin";
import { formatRelativeTime } from "@/lib/time";

export const AdminUsersPanel = () => {
  const { user: viewer } = useAuth();
  const [queryInput, setQueryInput] = useState("");
  const deferredQuery = useDeferredValue(queryInput.trim());
  const usersQuery = useAdminUsers(deferredQuery.length > 0 ? deferredQuery : undefined);

  return (
    <div className="space-y-4">
      <AdminPanelHeader
        title="Users"
        description="Search the user directory and manage accounts."
        action={
          <AdminSearchInput
            value={queryInput}
            onChange={(event) => setQueryInput(event.target.value)}
            placeholder="Search by username..."
          />
        }
      />

      <AdminPanelState query={usersQuery} emptyMessage="No users found." errorMessage="Could not load users.">
        {(users) => (
          <Card>
            <Table>
              <TableHeader>
                <TableRow className="border-0 hover:bg-transparent">
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((adminUser) => (
                  <TableRow key={adminUser.id}>
                    <TableCell>
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
                    </TableCell>
                    <TableCell className="text-muted-foreground">{adminUser.email}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatRelativeTime(adminUser.createdAt.toISOString())}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {adminUser.isAdmin ? <Badge>Admin</Badge> : null}
                        {adminUser.isSuspended ? (
                          <Badge variant="muted" className="border-destructive/40 text-destructive">
                            Suspended
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <ResetPasswordAction username={adminUser.username} />
                        {viewer?.username !== adminUser.username ? (
                          <>
                            <RoleAction user={adminUser} />
                            <SuspendAction user={adminUser} />
                            <DeleteUserAction username={adminUser.username} />
                          </>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </AdminPanelState>
    </div>
  );
};
