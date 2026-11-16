import { useState } from "react";
import { Lock } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DiaryTagInput } from "@/features/diary/components/DiaryTagInput";
import { useUserDiaryTags } from "@/features/diary/hooks/useDiaryTags";
import type { PrivateFieldsEdit } from "@/features/media/log-editor/log-private-fields";
import { DIARY_NOTE_MAX_LENGTH } from "@/types/api";

export type LogEditorPrivateFields = {
  note: string;
  tags: string[];
  isReady: boolean;
  hasSavedNote: boolean;
  change: (patch: PrivateFieldsEdit) => void;
};

// Public tags with suggestions from the viewer's own, and a private note that starts collapsed.
export const LogPrivateFields = ({ fields }: { fields: LogEditorPrivateFields }) => {
  const { user } = useAuth();
  const suggestions = useUserDiaryTags(user?.username).data?.map((count) => count.tag) ?? [];
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const showNote = isNoteOpen || fields.hasSavedNote;

  return (
    <>
      <section>
        <p className="kicker mb-1.5">Tags</p>
        <DiaryTagInput
          value={fields.tags}
          onChange={(tags) => fields.change({ tags })}
          suggestions={suggestions}
          disabled={!fields.isReady}
        />
      </section>
      <section>
        {showNote ? (
          <>
            <p className="kicker mb-1.5 inline-flex items-center gap-1.5">
              <Lock aria-hidden className="size-3" />
              Private note
            </p>
            <Textarea
              aria-label="Private note"
              maxLength={DIARY_NOTE_MAX_LENGTH}
              value={fields.note}
              disabled={!fields.isReady}
              onChange={(event) => fields.change({ note: event.target.value })}
              placeholder="Only you can see this."
              className="body min-h-20 rounded-[3px] border-[color:var(--line)] bg-foreground/[0.03] field-sizing-content"
            />
            <p className="mt-1 text-right font-mono text-[10px] tabular-nums text-[color:var(--faint)]">
              {`${fields.note.length} / ${DIARY_NOTE_MAX_LENGTH}`}
            </p>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setIsNoteOpen(true)}
            disabled={!fields.isReady}
            className="body-s inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <Lock aria-hidden className="size-3.5" />
            Add a private note
          </button>
        )}
      </section>
    </>
  );
};
