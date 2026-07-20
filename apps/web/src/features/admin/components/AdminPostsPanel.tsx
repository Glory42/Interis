import { useDeferredValue, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { AdminConfirmDialog } from "@/features/admin/components/AdminConfirmDialog";
import type { AdminPost } from "@/features/admin/content-api";
import { useAdminPosts, useDeleteAdminPost } from "@/features/admin/hooks/useAdminContent";
import { isApiError } from "@/lib/api-client";
import { formatRelativeTime } from "@/lib/time";

const DeletePostAction = ({ post }: { post: AdminPost }) => {
  const { mutateAsync: deletePost, isPending } = useDeleteAdminPost();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    try {
      await deletePost(post.id);
      setIsOpen(false);
    } catch (submitError) {
      setError(isApiError(submitError) ? submitError.message : "Could not delete post.");
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
        title="Delete post"
        description={`Permanently delete @${post.authorUsername}'s post?`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={isPending}
        error={error}
        onConfirm={() => void handleConfirm()}
      />
    </>
  );
};

export const AdminPostsPanel = () => {
  const [usernameInput, setUsernameInput] = useState("");
  const deferredUsername = useDeferredValue(usernameInput.trim());
  const postsQuery = useAdminPosts({
    username: deferredUsername.length > 0 ? deferredUsername : undefined,
  });

  return (
    <div className="space-y-4">
      <Input
        value={usernameInput}
        onChange={(event) => setUsernameInput(event.target.value)}
        placeholder="Filter by username..."
        className="max-w-sm"
      />

      {postsQuery.isPending ? (
        <div className="flex items-center justify-center py-10">
          <Spinner />
        </div>
      ) : postsQuery.isError ? (
        <p className="text-sm text-muted-foreground">Could not load posts.</p>
      ) : postsQuery.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No posts found.</p>
      ) : (
        <div className="space-y-3">
          {postsQuery.data.map((post) => (
            <div key={post.id} className="border border-border/60 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-foreground">@{post.authorUsername}</span>
                  {post.mediaType ? <Badge variant="muted">{post.mediaType}</Badge> : null}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(post.createdAt.toISOString())}
                  </span>
                  <DeletePostAction post={post} />
                </div>
              </div>
              <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-foreground/90">
                {post.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
