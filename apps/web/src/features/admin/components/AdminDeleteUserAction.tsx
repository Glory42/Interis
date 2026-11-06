import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminConfirmDialog } from "@/features/admin/components/AdminConfirmDialog";
import { AdminPasswordField } from "@/features/admin/components/AdminPasswordField";
import { useDeleteUser } from "@/features/admin/hooks/useAdmin";
import { isApiError } from "@/lib/api-client";

export const AdminDeleteUserAction = ({ username }: { username: string }) => {
  const { mutateAsync: deleteUser, isPending } = useDeleteUser();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (confirmText !== username) return;

    setError(null);
    try {
      await deleteUser({ username, adminPassword });
      setIsOpen(false);
      setAdminPassword("");
    } catch (submitError) {
      setError(isApiError(submitError) ? submitError.message : "Could not delete user.");
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
        onClick={() => {
          setIsOpen(true);
          setError(null);
        }}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
      <AdminConfirmDialog
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setConfirmText("");
          setAdminPassword("");
          setError(null);
        }}
        title="Delete account"
        description={`This permanently deletes @${username} and all of their diary entries, reviews, posts, and lists. This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={isPending}
        isConfirmDisabled={confirmText !== username || adminPassword.length === 0}
        error={error}
        onConfirm={() => void handleDelete()}
      >
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            Type <span className="font-mono">{username}</span> to confirm:
          </p>
          <Input
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            placeholder={username}
            type="text"
            className="h-8 text-sm"
          />
        </div>
        <AdminPasswordField value={adminPassword} onChange={setAdminPassword} />
      </AdminConfirmDialog>
    </>
  );
};
