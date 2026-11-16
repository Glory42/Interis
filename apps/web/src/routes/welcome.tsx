import { createFileRoute } from "@tanstack/react-router";
import { OnboardingPage, type OnboardingStep } from "@/features/onboarding/pages/OnboardingPage";
import { requirePendingOnboarding } from "@/lib/router/auth-guards";

type WelcomeSearch = { step?: OnboardingStep };

export const Route = createFileRoute("/welcome")({
  validateSearch: (search: Record<string, unknown>): WelcomeSearch =>
    search.step === "people" ? { step: "people" } : {},
  beforeLoad: async ({ context }) => {
    await requirePendingOnboarding({ queryClient: context.queryClient });
  },
  component: WelcomeRoute,
});

function WelcomeRoute() {
  const { step = "taste" } = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <OnboardingPage
      step={step}
      onStepChange={(next) => void navigate({ search: next === "taste" ? {} : { step: next } })}
    />
  );
}
