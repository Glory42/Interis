import type { MouseEvent } from "react";

// A click on a card's own background: its links, buttons and fields keep their
// meaning, and so do clicks inside a dialog portaled out of it or a text selection.
export const isCardBackgroundClick = (event: MouseEvent<HTMLElement>): boolean => {
  const target = event.target as HTMLElement;
  if (!event.currentTarget.contains(target)) return false;
  if (target.closest("a, button, input, textarea, label, select")) return false;
  return !window.getSelection()?.toString();
};
