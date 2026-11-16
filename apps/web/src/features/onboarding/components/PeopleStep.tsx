import { Button } from "@/components/ui/button";
import { OnboardingFooter } from "@/features/onboarding/components/OnboardingFooter";
import { FollowSuggestionList } from "@/features/social/components/FollowSuggestionList";

export const ONBOARDING_SUGGESTIONS_LIMIT = 15;

type PeopleStepProps = {
  onBack: () => void;
  onFinish: () => void;
  isFinishing: boolean;
};

// Step 2: people whose taste overlaps yours; following fills the feed.
export const PeopleStep = ({ onBack, onFinish, isFinishing }: PeopleStepProps) => (
  <div>
    <h1 className="display-3 text-foreground">People to follow</h1>
    <p className="body-s mt-1 max-w-xl text-muted-foreground">
      Ranked by how much your taste overlaps. Their diaries and reviews show up in your feed.
    </p>

    <FollowSuggestionList
      limit={ONBOARDING_SUGGESTIONS_LIMIT}
      className="mt-4 max-w-xl"
      emptyText="No one to suggest yet. You can find people from any review or profile later."
    />

    <OnboardingFooter>
      <div className="flex items-center gap-3">
        <Button type="button" variant="ghost" onClick={onBack} disabled={isFinishing}>
          Back
        </Button>
        <Button type="button" variant="ghost" onClick={onFinish} disabled={isFinishing} className="ml-auto">
          Skip
        </Button>
        <Button type="button" onClick={onFinish} loading={isFinishing}>
          Go to your feed
        </Button>
      </div>
    </OnboardingFooter>
  </div>
);
