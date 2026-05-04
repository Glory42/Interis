import { X } from "lucide-react";

type PostActivityDialogHeaderProps = {
  dialogTitle: string;
  onClose: () => void;
};

export const PostActivityDialogHeader = ({
  dialogTitle,
  onClose,
}: PostActivityDialogHeaderProps) => {
  return (
    <div className="flex items-start justify-between border-b border-border/70 px-4 py-3">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          POST THREAD
        </p>
        <p className="font-mono text-xs text-foreground">{dialogTitle}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="inline-flex h-7 w-7 items-center justify-center border border-border/70 text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
