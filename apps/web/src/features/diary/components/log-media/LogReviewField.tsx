import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useKeyboardInset } from "@/lib/use-keyboard-inset";
import { cn } from "@/lib/utils";

type LogReviewFieldProps = {
  isPhone: boolean;
  review: string;
  onReviewChange: (nextValue: string) => void;
  containsSpoilers: boolean;
  onContainsSpoilersChange: (nextValue: boolean) => void;
  reviewMaxLength: number;
  reviewPlaceholder: string;
  onWritingChange?: (isWriting: boolean) => void;
};

// Review box with the spoilers switch and count; on phones that bar rides above the keyboard.
export const LogReviewField = ({
  isPhone,
  review,
  onReviewChange,
  containsSpoilers,
  onContainsSpoilersChange,
  reviewMaxLength,
  reviewPlaceholder,
  onWritingChange,
}: LogReviewFieldProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const keyboardInset = useKeyboardInset();
  const followsKeyboard = isPhone && isFocused && keyboardInset > 0;

  const setFocused = (focused: boolean) => {
    setIsFocused(focused);
    onWritingChange?.(focused);
  };

  return (
    <section className={cn("flex min-h-0 flex-col", !isPhone && "flex-1")}>
      <p className="kicker mb-1.5">Review</p>
      <Textarea
        maxLength={reviewMaxLength}
        value={review}
        onChange={(event) => onReviewChange(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={reviewPlaceholder}
        // On phones the box grows with the text instead of filling the screen.
        className={cn(
          "body min-h-32 rounded-[3px] border-[color:var(--line)] bg-foreground/[0.03]",
          isPhone ? "max-h-[40dvh] field-sizing-content" : "flex-1",
        )}
      />
      <div
        className={cn(
          "mt-2 flex items-center justify-between gap-3",
          followsKeyboard && "fixed inset-x-0 z-10 mt-0 border-t border-[color:var(--line)] bg-[color:var(--slate)] px-4 py-2",
        )}
        style={followsKeyboard ? { bottom: keyboardInset } : undefined}
      >
        <button
          type="button"
          role="switch"
          aria-checked={containsSpoilers}
          // Keeps the textarea focused, so the keyboard stays up while you flip it.
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onContainsSpoilersChange(!containsSpoilers)}
          className={cn(
            "caption inline-flex items-center gap-2 rounded-[3px] border px-2.5 py-1.5 transition-colors",
            containsSpoilers
              ? "border-[color:var(--danger)]/50 bg-[color:var(--danger)]/12 text-[color:var(--danger)]"
              : "border-[color:var(--line)] text-muted-foreground",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "relative inline-block h-3 w-[22px] rounded-full bg-[color:var(--line-strong)] after:absolute after:top-0.5 after:size-2 after:rounded-full after:bg-current after:transition-[left]",
              containsSpoilers ? "after:left-3" : "after:left-0.5",
            )}
          />
          Contains spoilers
        </button>
        <span className="font-mono text-[10px] tabular-nums text-[color:var(--faint)]">
          {`${review.length} / ${reviewMaxLength}`}
        </span>
      </div>
    </section>
  );
};
