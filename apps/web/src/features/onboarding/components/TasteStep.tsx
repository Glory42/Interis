import { useCallback, useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/button";
import type { OnboardingTitle } from "@/features/onboarding/api";
import { OnboardingFooter } from "@/features/onboarding/components/OnboardingFooter";
import { TasteRatingBar } from "@/features/onboarding/components/TasteRatingBar";
import { TasteTile } from "@/features/onboarding/components/TasteTile";
import { useOnboardingTitles, useSaveTaste } from "@/features/onboarding/hooks/useOnboarding";
import { useTasteDraft } from "@/features/onboarding/hooks/useTasteDraft";
import { toTasteChanges } from "@/features/onboarding/taste-draft";
import { toViewerStatusParam, useViewerStatuses } from "@/features/viewer-status/hooks/useViewerStatuses";

const NO_TITLES: OnboardingTitle[] = [];
const keyOf = (title: OnboardingTitle) => `${title.mediaType}:${title.tmdbId}`;

type TasteStepProps = {
  userId: string;
  onContinue: () => void;
  onSkip: () => void;
};

// Step 1: tap the posters you've seen, rate any you like, save them in one request.
export const TasteStep = ({ userId, onContinue, onSkip }: TasteStepProps) => {
  const titlesQuery = useOnboardingTitles();
  const titles = titlesQuery.data ?? NO_TITLES;
  const statuses = useViewerStatuses(titles, titles.length > 0);
  const statusParam = useMemo(() => toViewerStatusParam(titles), [titles]);
  const { draft, markOf, toggle, rate, reset } = useTasteDraft(userId, statuses);
  const saveTaste = useSaveTaste(statusParam);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const handleToggle = useCallback(
    (key: string) => {
      toggle(key);
      setActiveKey(key);
    },
    [toggle],
  );

  const activeTitle = titles.find((title) => keyOf(title) === activeKey) ?? null;
  const activeMark = activeKey ? markOf(activeKey) : null;
  const markedCount = titles.filter((title) => markOf(keyOf(title)).watched).length;

  const handleContinue = async () => {
    const changes = toTasteChanges(titles, draft, statuses);
    if (changes.length > 0) {
      try {
        await saveTaste.mutateAsync(changes);
      } catch {
        return;
      }
    }
    reset();
    onContinue();
  };

  return (
    <div>
      <h1 className="display-3 text-foreground">What have you watched?</h1>
      <p className="body-s mt-1 max-w-xl text-muted-foreground">
        Tap the films and series you've seen. We'll use them to find people with your taste. Nothing here posts to anyone's
        feed.
      </p>

      {titlesQuery.isPending ? (
        <div role="status" aria-label="Loading titles" className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {Array.from({ length: 12 }, (_, index) => (
            <Skeleton key={index} shape="poster" />
          ))}
        </div>
      ) : titles.length === 0 ? (
        <p className="body-s mt-5 border-l-2 border-[color:var(--line)] pl-4 text-muted-foreground">
          Couldn't load titles right now. You can skip this step and log films later.
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-4 md:grid-cols-6">
          {titles.map((title) => {
            const key = keyOf(title);
            const mark = markOf(key);
            return (
              <TasteTile
                key={key}
                title={title}
                tileKey={key}
                watched={mark.watched}
                rating={mark.rating}
                onToggle={handleToggle}
              />
            );
          })}
        </div>
      )}

      <OnboardingFooter>
        <TasteRatingBar
          title={activeMark?.watched ? activeTitle : null}
          rating={activeMark?.rating ?? null}
          onRate={(rating) => {
            if (activeKey) rate(activeKey, rating);
          }}
        />
        {saveTaste.isError ? (
          <p role="alert" className="text-xs text-[color:var(--danger)]">
            Couldn't save your picks. Try again.
          </p>
        ) : null}
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" onClick={onSkip} disabled={saveTaste.isPending}>
            Skip
          </Button>
          <span className="ml-auto font-mono text-[11px] text-muted-foreground" aria-live="polite">
            {markedCount} marked
          </span>
          <Button type="button" onClick={() => void handleContinue()} loading={saveTaste.isPending}>
            Continue
          </Button>
        </div>
      </OnboardingFooter>
    </div>
  );
};
