import { useDeferredValue, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { AdminConfirmDialog } from "@/features/admin/components/AdminConfirmDialog";
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
      <button
        type="button"
        className="text-xs text-destructive/80 hover:text-destructive"
        onClick={() => setIsOpen(true)}
      >
        Delete
      </button>
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
      <div className="flex items-center gap-2">
        <Input
          value={usernameInput}
          onChange={(event) => setUsernameInput(event.target.value)}
          placeholder="Filter by username..."
          className="max-w-sm"
        />
        <select
          value={type}
          onChange={(event) => setType(event.target.value as ActivityType | "")}
          className="h-9 border border-border bg-background/30 px-2 text-sm text-foreground outline-none focus:border-primary"
        >
          <option value="">All types</option>
          {ACTIVITY_TYPES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {activitiesQuery.isPending ? (
        <div className="flex items-center justify-center py-10">
          <Spinner />
        </div>
      ) : activitiesQuery.isError ? (
        <p className="text-sm text-muted-foreground">Could not load activities.</p>
      ) : activitiesQuery.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activities found.</p>
      ) : (
        <div className="border border-border/60">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {activitiesQuery.data.map((activity) => (
                <tr key={activity.id} className="border-b border-border/40 last:border-0">
                  <td className="px-3 py-2 text-foreground">@{activity.authorUsername}</td>
                  <td className="px-3 py-2">
                    <Badge variant="muted">{activity.type}</Badge>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {formatRelativeTime(activity.createdAt.toISOString())}
                  </td>
                  <td className="px-3 py-2">
                    <DeleteActivityAction activity={activity} />
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
