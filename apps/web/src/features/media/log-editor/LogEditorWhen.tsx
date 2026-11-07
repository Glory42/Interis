import { useId } from "react";
import { RotateCcw } from "lucide-react";
import { CalendarPicker } from "@/components/ui/CalendarPicker";
import { todayAsLocalDateInput } from "@/lib/time";

export type LogWhen =
  | {
      type: "log";
      watchedDate: string;
      onWatchedDateChange: (nextValue: string) => void;
      rewatch: boolean;
      onRewatchChange: (nextValue: boolean) => void;
    }
  | { type: "watched"; watched: boolean; onWatchedChange: (nextValue: boolean) => void };

const dashed = "border-b border-dashed border-[color:var(--primary)] text-foreground";

// "Watched today · first watch" for a log; a single Watched box for a season or episode review.
export const LogEditorWhen = ({ isPhone, when }: { isPhone: boolean; when: LogWhen }) => {
  const dateInputId = useId();

  if (when.type === "log") {
    const { watchedDate, onWatchedDateChange, rewatch, onRewatchChange } = when;
    return (
      <div className="body-s flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground">
        <span>Watched</span>
        {isPhone ? (
          <>
            <label htmlFor={dateInputId} className="sr-only">
              Watched on
            </label>
            <input
              id={dateInputId}
              type="date"
              value={watchedDate}
              max={todayAsLocalDateInput()}
              onChange={(event) => {
                if (event.target.value) onWatchedDateChange(event.target.value);
              }}
              className={`bg-transparent font-mono text-sm ${dashed}`}
            />
          </>
        ) : (
          <CalendarPicker value={watchedDate} max={todayAsLocalDateInput()} onChange={onWatchedDateChange} variant="inline" />
        )}
        <span aria-hidden>·</span>
        <button
          type="button"
          aria-pressed={rewatch}
          onClick={() => onRewatchChange(!rewatch)}
          className={`inline-flex items-center gap-1 ${dashed}`}
        >
          {rewatch ? "Rewatch" : "First watch"}
          <RotateCcw aria-hidden className="size-3" />
        </button>
      </div>
    );
  }

  return (
    <label className="body-s inline-flex cursor-pointer items-center gap-2 text-foreground">
      <input
        type="checkbox"
        checked={when.watched}
        onChange={(event) => when.onWatchedChange(event.target.checked)}
        className="size-4 accent-primary"
      />
      Watched
    </label>
  );
};
