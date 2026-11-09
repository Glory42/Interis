import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminConfirmDialog } from "@/features/admin/components/AdminConfirmDialog";
import { AdminPanelHeader } from "@/features/admin/components/AdminPanelHeader";
import { AdminPanelState } from "@/features/admin/components/AdminPanelState";
import type { AdminComment } from "@/features/admin/audit-comments-api";
import { useAdminComments, useDeleteAdminComment } from "@/features/admin/hooks/useAdminAuditComments";
import { formatRelativeTime } from "@/lib/time";

const CommentRow = ({ comment }: { comment: AdminComment }) => {
  const mutation = useDeleteAdminComment();
  const [isOpen, setIsOpen] = useState(false);
  return (
    <li className="flex items-start gap-3 border-b border-[color:var(--line)] py-2.5">
      <div className="min-w-0 flex-1">
        <p className="mono-meta uppercase text-muted-foreground">
          {`@${comment.authorUsername ?? "deleted"} · on a ${comment.kind} · ${formatRelativeTime(comment.createdAt.toISOString())}`}
        </p>
        <p className="user-text body-s mt-0.5 whitespace-pre-wrap text-foreground">{comment.content}</p>
      </div>
      <Button variant="ghost" size="sm" aria-label="Delete comment" className="h-7 w-7 p-0 text-[color:var(--danger)]" onClick={() => setIsOpen(true)}>
        <Trash2 aria-hidden className="size-3.5" />
      </Button>
      <AdminConfirmDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Delete comment"
        description={`Permanently delete @${comment.authorUsername ?? "deleted"}'s comment? This is written to the audit log.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={mutation.isPending}
        onConfirm={() => mutation.mutate({ kind: comment.kind, id: comment.id }, { onSuccess: () => setIsOpen(false) })}
      />
    </li>
  );
};

export const AdminCommentsPanel = () => {
  const query = useAdminComments();
  return (
    <div className="space-y-4">
      <AdminPanelHeader title="Comments" description="Comments on reviews and posts, newest first." />
      <AdminPanelState query={query} emptyMessage="No comments yet." errorMessage="Could not load comments.">
        {(comments) => (
          <ul className="border-t border-[color:var(--line)]">
            {comments.map((comment) => (
              <CommentRow key={`${comment.kind}-${comment.id}`} comment={comment} />
            ))}
          </ul>
        )}
      </AdminPanelState>
    </div>
  );
};
