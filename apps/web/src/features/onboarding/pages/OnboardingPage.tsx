import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PeopleStep } from "@/features/onboarding/components/PeopleStep";
import { TasteStep } from "@/features/onboarding/components/TasteStep";
import { useCompleteOnboarding } from "@/features/onboarding/hooks/useOnboarding";
import { cn } from "@/lib/utils";

export type OnboardingStep = "taste" | "people";

const STEPS: OnboardingStep[] = ["taste", "people"];

type OnboardingPageProps = {
  step: OnboardingStep;
  // The step lives in the URL, so a refresh resumes where you were.
  onStepChange: (step: OnboardingStep) => void;
};

// Shown once after sign-up: seed your taste, follow a few people, land on a feed with content.
export const OnboardingPage = ({ step, onStepChange }: OnboardingPageProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const completeOnboarding = useCompleteOnboarding();
  const stepNumber = STEPS.indexOf(step) + 1;

  const finish = async () => {
    try {
      await completeOnboarding.mutateAsync();
    } catch {
      return;
    }
    await navigate({ to: "/" });
  };

  if (!user) return null;

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-8">
      <div className="overflow-clip rounded-[3px] border border-[color:var(--line)]">
        <div className="slate mono-meta uppercase">
          <span>Interis · Welcome, {user.username}</span>
          <span>
            Step {stepNumber} of {STEPS.length}
          </span>
        </div>
        <div aria-hidden className="flex gap-1 px-4 pt-4 sm:px-6">
          {STEPS.map((item, index) => (
            <span
              key={item}
              className={cn("h-0.5 flex-1 rounded-sm", index < stepNumber ? "bg-primary" : "bg-[color:var(--line)]")}
            />
          ))}
        </div>
        <div className="px-4 pt-4 sm:px-6 sm:pt-5">
          {step === "taste" ? (
            <TasteStep
              userId={user.id}
              onContinue={() => onStepChange("people")}
              onSkip={() => onStepChange("people")}
            />
          ) : (
            <PeopleStep
              onBack={() => onStepChange("taste")}
              onFinish={() => void finish()}
              isFinishing={completeOnboarding.isPending}
            />
          )}
          {completeOnboarding.isError ? (
            <p role="alert" className="pb-3 text-xs text-[color:var(--danger)]">
              Couldn't finish setup. Try again.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
};
