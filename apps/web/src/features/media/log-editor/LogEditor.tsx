import { useState } from "react";
import { createPortal } from "react-dom";
import { DeleteLogConfirm } from "@/features/media/log-editor/DeleteLogConfirm";
import { LogEditorDialog } from "@/features/media/log-editor/LogEditorDialog";
import type { LogSubject } from "@/features/media/log-editor/log-subject";
import { useLogEditor } from "@/features/media/log-editor/use-log-editor";
import type { UpdateLogInput } from "@/features/media/log-editor/use-log-mutations";
import { getPosterUrl } from "@/features/media/tmdb-images";

type LogEditorProps = {
  subject: LogSubject;
  isOpen: boolean;
  onClose: () => void;
  // Runs after a save, before onClose; `changes` is null for a new log.
  onSaved?: (changes: UpdateLogInput | null) => void;
};

const subjectKey = (subject: LogSubject) =>
  subject.type === "new" ? `new:${subject.kind}:${subject.tmdbId}` : `log:${subject.logId}`;

// Logs a Film or Series, or edits one of the viewer's logs with its attached Review in one save.
// Mounted only while open, so every open starts from the subject.
export const LogEditor = ({ isOpen, ...props }: LogEditorProps) =>
  isOpen ? createPortal(<LogEditorForm key={subjectKey(props.subject)} {...props} />, document.body) : null;

const LogEditorForm = ({ subject, onClose, onSaved }: Omit<LogEditorProps, "isOpen">) => {
  const editor = useLogEditor(subject, onClose, onSaved);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const { draft, change } = editor;

  return (
    <>
      <LogEditorDialog
        mode={subject.type === "new" ? "log" : "edit"}
        media={{
          kind: subject.kind,
          title: subject.title,
          year: subject.year,
          posterUrl: getPosterUrl(subject.posterPath),
        }}
        when={{
          type: "log",
          watchedDate: draft.watchedDate,
          onWatchedDateChange: (watchedDate) => change({ watchedDate }),
          rewatch: draft.rewatch,
          onRewatchChange: (rewatch) => change({ rewatch }),
        }}
        rating={draft.rating}
        onRatingChange={(rating) => change({ rating })}
        liked={editor.liked}
        onLikedChange={editor.setLiked}
        review={{
          text: draft.review,
          containsSpoilers: draft.containsSpoilers,
          placeholder: `Share your thoughts about this ${subject.kind === "film" ? "movie" : "series"}...`,
          onTextChange: (review) => change({ review }),
          onContainsSpoilersChange: (containsSpoilers) => change({ containsSpoilers }),
        }}
        formError={editor.formError}
        isSubmitting={editor.isSubmitting}
        canSubmit={editor.canSubmit}
        onSubmit={() => {
          void editor.save();
        }}
        onClose={onClose}
        deleteAction={
          subject.type === "existing" ? { label: "Delete log", onClick: () => setIsConfirmingDelete(true) } : undefined
        }
      />
      {subject.type === "existing" && isConfirmingDelete ? (
        <DeleteLogConfirm subject={subject} onClose={() => setIsConfirmingDelete(false)} onDeleted={onClose} />
      ) : null}
    </>
  );
};
