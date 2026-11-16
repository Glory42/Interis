import { useState } from "react";

const NOTE_MAX_LENGTH = 500;

type ListEntryNoteFieldProps = {
  note: string | null;
  title: string;
  onSave: (note: string | null) => void;
};

// Saves on blur, only when the note actually changed.
export const ListEntryNoteField = ({ note, title, onSave }: ListEntryNoteFieldProps) => {
  const [draft, setDraft] = useState(note ?? "");

  return (
    <input
      type="text"
      aria-label={`Note for ${title}`}
      value={draft}
      maxLength={NOTE_MAX_LENGTH}
      placeholder="Add a note"
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => {
        const next = draft.trim() || null;
        if (next !== note) onSave(next);
      }}
      onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
      className="user-text mt-1 w-full rounded-md border border-transparent bg-transparent px-1.5 py-1 font-mono text-xs text-muted-foreground placeholder:text-muted-foreground/60 hover:border-border/50 focus-visible:border-border/75 focus-visible:text-foreground focus-visible:outline-none"
    />
  );
};
