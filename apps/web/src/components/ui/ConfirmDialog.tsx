import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModalHeader } from "@/components/ui/ModalHeader";
import { ModalShell } from "@/components/ui/ModalShell";
import { cn } from "@/lib/utils";

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  // Slate label above the title, e.g. "Account · Delete".
  context?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isConfirming?: boolean;
  isConfirmDisabled?: boolean;
  // Adds a "Current password" field; confirm stays disabled until it's filled.
  requirePassword?: boolean;
  onConfirm: (password?: string) => void;
  onClose: () => void;
  maxWidthClassName?: string;
  children?: ReactNode;
  error?: string | null;
};

// Confirm/cancel popup for destructive actions, on the custom modal pattern (CLAUDE.md).
// Mounted only while open, so a typed password never survives a close.
export const ConfirmDialog = (props: ConfirmDialogProps) =>
  props.isOpen ? <ConfirmDialogPanel {...props} /> : null;

const ConfirmDialogPanel = ({
  title,
  context = "Confirm",
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDestructive = false,
  isConfirming = false,
  isConfirmDisabled = false,
  requirePassword = false,
  onConfirm,
  onClose,
  maxWidthClassName = "max-w-sm",
  children,
  error,
}: ConfirmDialogProps) => {
  const [password, setPassword] = useState("");
  const closeLabel = `Close ${title} dialog`;

  return (
    <ModalShell onClose={onClose} containerClassName={maxWidthClassName} overlayClassName="z-150" ariaCloseLabel={closeLabel}>
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="theme-modal-panel relative w-full overflow-hidden border border-[color:var(--line-strong)] bg-background animate-fade-up"
      >
        <ModalHeader title={context} onClose={onClose} closeAriaLabel={closeLabel} />

        <div className="space-y-3 px-4 py-4">
          <h2 className="display-4 text-foreground">{title}</h2>
          {description ? <p className="body-s text-muted-foreground">{description}</p> : null}
          {children}
          {requirePassword ? (
            <label className="block space-y-1.5">
              <span className="kicker text-muted-foreground">Current password</span>
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
          ) : null}
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[color:var(--line)] px-4 py-2.5">
          <Button variant="ghost" onClick={onClose} disabled={isConfirming}>
            {cancelLabel}
          </Button>
          <Button
            variant={isDestructive ? "danger" : "primary"}
            className={cn(isDestructive && "border-destructive bg-destructive text-background hover:bg-destructive/85")}
            loading={isConfirming}
            disabled={isConfirmDisabled || (requirePassword && password.length === 0)}
            onClick={() => onConfirm(requirePassword ? password : undefined)}
          >
            {confirmLabel}
          </Button>
        </div>
      </section>
    </ModalShell>
  );
};
