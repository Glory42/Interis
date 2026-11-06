import { useSyncExternalStore } from "react";

const readInset = () => {
  const viewport = window.visualViewport;
  if (!viewport) return 0;
  return Math.max(0, Math.round(window.innerHeight - viewport.height - viewport.offsetTop));
};

// How far the on-screen keyboard covers the bottom of the layout viewport; 0 when
// the browser has no visualViewport, so callers fall back to normal page flow.
export const useKeyboardInset = (): number =>
  useSyncExternalStore(
    (onChange) => {
      const viewport = window.visualViewport;
      if (!viewport) return () => {};
      viewport.addEventListener("resize", onChange);
      viewport.addEventListener("scroll", onChange);
      return () => {
        viewport.removeEventListener("resize", onChange);
        viewport.removeEventListener("scroll", onChange);
      };
    },
    readInset,
    () => 0,
  );
