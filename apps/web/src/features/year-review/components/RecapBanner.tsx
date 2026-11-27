import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { isRecapSeason, recapYearFor } from "@/features/year-review/year-review-model";

type RecapBannerProps = { userId: string; username: string; now?: Date };

const dismissedKey = (userId: string, year: number) => `interis:recap-banner:${userId}:${year}`;

// Storage errors just mean the banner may show again.
const isDismissed = (key: string): boolean => {
  try {
    return window.localStorage.getItem(key) !== null;
  } catch {
    return false;
  }
};

const rememberDismissal = (key: string) => {
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    // ignore
  }
};

// The home feed's Dec 1 – Jan 15 nudge toward the signed-in user's recap; dismissal is per browser.
export const RecapBanner = ({ userId, username, now: nowProp }: RecapBannerProps) => {
  const now = nowProp ?? new Date();
  const year = recapYearFor(now);
  const key = dismissedKey(userId, year);
  const [isVisible, setIsVisible] = useState(() => isRecapSeason(now) && !isDismissed(key));

  if (!isVisible) return null;

  return (
    <section
      aria-label={`Your ${year} recap`}
      className="animate-fade-up mb-4 flex items-center gap-3 overflow-hidden rounded-[3px] border border-[color:var(--line)] bg-[color:var(--slate)] p-4"
    >
      <div className="min-w-0 flex-1">
        <p className="kicker text-primary">Year in review</p>
        <p className="mt-1 font-display text-xl leading-tight font-bold text-white sm:text-2xl">{`Your ${year} recap is ready.`}</p>
        <Link
          to="/recap/$username/$year"
          params={{ username, year: String(year) }}
          className="mono-meta mt-2 inline-block text-[11px] text-[#bdbdbd] uppercase hover:text-white"
        >
          Take your seat →
        </Link>
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => {
          rememberDismissal(key);
          setIsVisible(false);
        }}
        className="shrink-0 self-start text-[#8a8a8a] hover:text-white"
      >
        <X aria-hidden className="size-4" />
      </button>
    </section>
  );
};
