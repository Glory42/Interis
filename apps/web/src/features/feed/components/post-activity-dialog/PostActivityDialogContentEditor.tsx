import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

type PostActivityDialogContentEditorProps = {
  isEditing: boolean;
  content: string;
  currentEditDraft: string;
  canSaveEdit: boolean;
  isSaving: boolean;
  onEditDraftChange: (nextDraft: string) => void;
  onEnableEditing: () => void;
  onCancelEditing: () => void;
  onSaveEditing: () => void;
};

export const PostActivityDialogContentEditor = ({
  isEditing,
  content,
  currentEditDraft,
  canSaveEdit,
  isSaving,
  onEditDraftChange,
  onEnableEditing,
  onCancelEditing,
  onSaveEditing,
}: PostActivityDialogContentEditorProps) => {
  if (isEditing) {
    return (
      <div className="space-y-2">
        <Textarea
          value={currentEditDraft}
          onChange={(event) => {
            if (event.target.value.length <= 250) {
              onEditDraftChange(event.target.value);
            }
          }}
          className="min-h-22 border-border/75 bg-background/45 font-mono text-sm"
        />
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] text-muted-foreground">
            {currentEditDraft.length}/250
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancelEditing}
              className="border border-border/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground"
            >
              cancel
            </button>
            <button
              type="button"
              onClick={onSaveEditing}
              disabled={!canSaveEdit}
              className="border border-primary/45 bg-primary/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? (
                <span className="inline-flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> saving
                </span>
              ) : (
                "save"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onEnableEditing}
      className="w-full text-left whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground/85"
    >
      {content}
    </button>
  );
};
