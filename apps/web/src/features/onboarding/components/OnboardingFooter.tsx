import type { ReactNode } from "react";

// Pinned to the bottom of the screen on phones so Continue stays in thumb reach.
export const OnboardingFooter = ({ children }: { children: ReactNode }) => (
  <div className="sticky bottom-0 z-10 -mx-4 mt-6 space-y-3 border-t border-[color:var(--line)] bg-background/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6">
    {children}
  </div>
);
