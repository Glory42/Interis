import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { SpoilerSwitch } from "@/features/media/log-editor/SpoilerSwitch";
import { useKeyboardInset } from "@/lib/use-keyboard-inset";
import { cn } from "@/lib/utils";

export type LogEditorReview = {
  text: string;
  containsSpoilers: boolean;
  placeholder: string;
  onTextChange: (nextValue: string) => void;
  onContainsSpoilersChange: (nextValue: boolean) => void;
};

type LogReviewFieldProps = {
  isPhone: boolean;
  review: LogEditorReview;
  maxLength: number;
  onWritingChange?: (isWriting: boolean) => void;
};

// Review box with the spoilers switch and count; on phones that bar rides above the keyboard.
export const LogReviewField = ({ isPhone, review, maxLength, onWritingChange }: LogReviewFieldProps) => {
  const { text, containsSpoilers, onContainsSpoilersChange } = review;
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
        aria-label="Review"
        maxLength={maxLength}
        value={text}
        onChange={(event) => review.onTextChange(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={review.placeholder}
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
        <SpoilerSwitch checked={containsSpoilers} onChange={onContainsSpoilersChange} />
        <span className="font-mono text-[10px] tabular-nums text-[color:var(--faint)]">
          {`${text.length} / ${maxLength}`}
        </span>
      </div>
    </section>
  );
};
