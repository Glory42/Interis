import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { normalizeDiaryTag } from "@/features/diary/diary-tags";
import { cn } from "@/lib/utils";
import { DIARY_TAG_MAX_LENGTH, DIARY_TAGS_MAX } from "@/types/api";

type DiaryTagInputProps = {
  value: string[];
  onChange: (tags: string[]) => void;
  // The user's own tags, most used first.
  suggestions: string[];
  disabled?: boolean;
};

const MAX_SUGGESTIONS = 6;
const chipClassName = "mono-meta inline-flex items-center gap-1 rounded-[3px] border border-[color:var(--line)] px-1.5 py-0.5";

// Tags as chips: Enter or a comma adds one, Backspace on an empty box removes the last.
export const DiaryTagInput = ({ value, onChange, suggestions, disabled = false }: DiaryTagInputProps) => {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const isFull = value.length >= DIARY_TAGS_MAX;
  const query = text.trim().toLowerCase();
  const shownSuggestions = suggestions
    .filter((tag) => !value.includes(tag) && tag.includes(query))
    .slice(0, MAX_SUGGESTIONS);

  const add = (raw: string) => {
    if (!raw.trim()) return;
    const tag = normalizeDiaryTag(raw);
    if (tag === null) {
      setError(`Tags are up to ${DIARY_TAG_MAX_LENGTH} letters, numbers, spaces, - _ or '.`);
      return;
    }
    setText("");
    setError(null);
    if (value.includes(tag)) return;
    if (isFull) {
      setError(`Up to ${DIARY_TAGS_MAX} tags per log.`);
      return;
    }
    onChange([...value, tag]);
  };

  const remove = (tag: string) => {
    setError(null);
    onChange(value.filter((current) => current !== tag));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      add(text);
    } else if (event.key === "Backspace" && text === "" && value.length > 0) {
      remove(value[value.length - 1]!);
    }
  };

  return (
    <div>
      <div
        className={cn(
          "flex min-h-10 flex-wrap items-center gap-1.5 rounded-[3px] border border-[color:var(--line)] bg-foreground/[0.03] px-2 py-1.5",
          disabled && "opacity-60",
        )}
      >
        {value.map((tag) => (
          <span key={tag} className={cn(chipClassName, "text-foreground")}>
            #{tag}
            <button
              type="button"
              onClick={() => remove(tag)}
              disabled={disabled}
              aria-label={`Remove tag ${tag}`}
              className="text-muted-foreground hover:text-foreground"
            >
              <X aria-hidden className="size-3" />
            </button>
          </span>
        ))}
        <input
          aria-label="Add a tag"
          value={text}
          disabled={disabled || isFull}
          maxLength={DIARY_TAG_MAX_LENGTH * 2}
          onChange={(event) => {
            const next = event.target.value;
            // A pasted "a, b" adds every complete tag at once.
            if (next.includes(",")) {
              const parts = next.split(",");
              const tags = parts.slice(0, -1).map(normalizeDiaryTag).filter((tag): tag is string => tag !== null);
              onChange([...new Set([...value, ...tags])].slice(0, DIARY_TAGS_MAX));
              setText(parts.at(-1) ?? "");
              return;
            }
            setText(next);
          }}
          onKeyDown={onKeyDown}
          onBlur={() => add(text)}
          placeholder={value.length === 0 ? "cinema, with mom, rewatch-night…" : isFull ? "" : "Add a tag"}
          className="body-s min-w-24 flex-1 bg-transparent py-0.5 text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>
      <div className="mt-1.5 flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {!disabled && !isFull
            ? shownSuggestions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  // Keeps the input's blur from committing half-typed text first.
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => add(tag)}
                  className={cn(chipClassName, "text-muted-foreground hover:text-foreground")}
                >
                  + {tag}
                </button>
              ))
            : null}
        </div>
        <span className="shrink-0 font-mono text-[10px] tabular-nums text-[color:var(--faint)]">
          {`${value.length} / ${DIARY_TAGS_MAX}`}
        </span>
      </div>
      {error ? (
        <p role="alert" className="body-s mt-1 text-[color:var(--danger)]">
          {error}
        </p>
      ) : null}
    </div>
  );
};
