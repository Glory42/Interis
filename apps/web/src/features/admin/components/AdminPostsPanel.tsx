import { useDeferredValue, useState } from "react";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AdminConfirmDialog } from "@/features/admin/components/AdminConfirmDialog";
import { AdminPanelHeader } from "@/features/admin/components/AdminPanelHeader";
import { AdminPanelState } from "@/features/admin/components/AdminPanelState";
import { AdminSearchInput } from "@/features/admin/components/AdminSearchInput";
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
      <AdminPanelHeader
        title="Posts"
        description="Moderate free-form community posts."
        action={
          <AdminSearchInput
            value={usernameInput}
            onChange={(event) => setUsernameInput(event.target.value)}
            placeholder="Filter by username..."
          />
        }
      />

      <AdminPanelState query={postsQuery} emptyMessage="No posts found." errorMessage="Could not load posts.">
        {(posts) => (
          <div className="space-y-3">
            {posts.map((post) => (
              <Card key={post.id}>
                <CardContent className="space-y-2 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-foreground">@{post.authorUsername}</span>
                      {post.mediaType ? <Badge variant="muted">{post.mediaType}</Badge> : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(post.createdAt.toISOString())}
                      </span>
                      <DeletePostAction post={post} />
                    </div>
                  </div>
                  <p className="line-clamp-3 whitespace-pre-wrap text-sm text-foreground/90">
                    {post.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </AdminPanelState>
    </div>
  );
};
