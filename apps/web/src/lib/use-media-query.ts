import { useSyncExternalStore } from "react";

export const PHONE_QUERY = "(max-width: 639px)";

// False wherever matchMedia is missing (jsdom, very old browsers).
export const useMediaQuery = (query: string): boolean =>
  useSyncExternalStore(
    (onChange) => {
      if (typeof window.matchMedia !== "function") return () => {};
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => typeof window.matchMedia === "function" && window.matchMedia(query).matches,
    () => false,
  );

// Matches Tailwind's md breakpoint: below it, detail pages use their phone layout.
export const BELOW_MD_QUERY = "(max-width: 767px)";
