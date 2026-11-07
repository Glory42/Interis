import { useId } from "react";
import { RotateCcw } from "lucide-react";
import { CalendarPicker } from "@/components/ui/CalendarPicker";
import { todayAsLocalDateInput } from "@/lib/time";

type LogMediaWhenProps = {
  isPhone: boolean;
  watchedDate?: string;
  onWatchedDateChange?: (nextValue: string) => void;
  rewatch?: boolean;
  onRewatchChange?: (nextValue: boolean) => void;
  watched?: boolean;
  onWatchedChange?: (nextValue: boolean) => void;
};

const dashed = "border-b border-dashed border-[color:var(--primary)] text-foreground";

// "Watched today · first watch" for a log; a single Watched box for a season or episode review.
export const LogMediaWhen = ({
  isPhone,
  watchedDate,
  onWatchedDateChange,
  rewatch,
  onRewatchChange,
  watched,
  onWatchedChange,
}: LogMediaWhenProps) => {
  const dateInputId = useId();

  if (watchedDate !== undefined && onWatchedDateChange) {
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
        {rewatch !== undefined && onRewatchChange ? (
          <>
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
          </>
        ) : null}
      </div>
    );
  }

  if (watched !== undefined && onWatchedChange) {
    return (
      <label className="body-s inline-flex cursor-pointer items-center gap-2 text-foreground">
        <input
          type="checkbox"
          checked={watched}
          onChange={(event) => onWatchedChange(event.target.checked)}
          className="size-4 accent-primary"
        />
        Watched
      </label>
    );
  }

  return null;
};
