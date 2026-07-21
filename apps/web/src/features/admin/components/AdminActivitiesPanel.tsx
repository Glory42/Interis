import { useDeferredValue, useState } from "react";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminConfirmDialog } from "@/features/admin/components/AdminConfirmDialog";
import { AdminPanelHeader } from "@/features/admin/components/AdminPanelHeader";
import { AdminPanelState } from "@/features/admin/components/AdminPanelState";
import { AdminSearchInput } from "@/features/admin/components/AdminSearchInput";
import type { AdminActivity, ActivityType } from "@/features/admin/community-api";
import {
  useAdminActivities,
  useDeleteAdminActivity,
} from "@/features/admin/hooks/useAdminCommunity";
import { isApiError } from "@/lib/api-client";
import { formatRelativeTime } from "@/lib/time";

const ACTIVITY_TYPES: ActivityType[] = [
  "diary_entry",
  "review",
  "liked_movie",
  "watchlisted_movie",
  "followed_user",
  "created_list",
  "liked_review",
  "commented",
  "post",
];

const DeleteActivityAction = ({ activity }: { activity: AdminActivity }) => {
  const { mutateAsync: deleteActivity, isPending } = useDeleteAdminActivity();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    try {
      await deleteActivity(activity.id);
      setIsOpen(false);
    } catch (submitError) {
      setError(isApiError(submitError) ? submitError.message : "Could not delete activity.");
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
        onClick={() => setIsOpen(true)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
      <AdminConfirmDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Delete activity"
        description={`Remove this "${activity.type}" activity from @${activity.authorUsername}'s feed?`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={isPending}
        error={error}
        onConfirm={() => void handleConfirm()}
      />
    </>
  );
};

export const AdminActivitiesPanel = () => {
  const [usernameInput, setUsernameInput] = useState("");
  const [type, setType] = useState<ActivityType | "">("");
  const deferredUsername = useDeferredValue(usernameInput.trim());
  const activitiesQuery = useAdminActivities({
    username: deferredUsername.length > 0 ? deferredUsername : undefined,
    type: type || undefined,
  });

  return (
    <div className="space-y-4">
      <AdminPanelHeader
        title="Activities"
        description="Moderate rows in the social activity feed."
        action={
          <div className="flex items-center gap-2">
            <AdminSearchInput
              wrapperClassName="max-w-[11rem]"
              value={usernameInput}
              onChange={(event) => setUsernameInput(event.target.value)}
              placeholder="Filter by username..."
            />
            <select
              value={type}
              onChange={(event) => setType(event.target.value as ActivityType | "")}
              className="h-9 border border-border bg-input px-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              <option value="">All types</option>
              {ACTIVITY_TYPES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        }
      />

      <AdminPanelState
        query={activitiesQuery}
        emptyMessage="No activities found."
        errorMessage="Could not load activities."
      >
        {(activities) => (
          <Card>
            <Table>
              <TableHeader>
                <TableRow className="border-0 hover:bg-transparent">
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>When</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="text-foreground">@{activity.authorUsername}</TableCell>
                    <TableCell>
                      <Badge variant="muted">{activity.type}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatRelativeTime(activity.createdAt.toISOString())}
                    </TableCell>
                    <TableCell>
                      <DeleteActivityAction activity={activity} />
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
