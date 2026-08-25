import type { ReactNode } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

type AdminConfirmDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  confirmLabel: string;
  variant?: "default" | "danger";
  isConfirmDisabled?: boolean;
  isLoading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  children?: ReactNode;
};

export const AdminConfirmDialog = ({
  variant = "default",
  isLoading = false,
  ...props
}: AdminConfirmDialogProps) => (
  <ConfirmDialog
    {...props}
    variant="panel"
    maxWidthClassName="max-w-md"
    cancelLabel="cancel"
    isDestructive={variant === "danger"}
    isConfirming={isLoading}
    loadingLabel="working"
  />
);
