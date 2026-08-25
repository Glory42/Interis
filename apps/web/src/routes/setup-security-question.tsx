import { createFileRoute } from "@tanstack/react-router";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { SetupSecurityQuestionForm } from "@/features/auth/components/SetupSecurityQuestionForm";
import { requireAuthenticatedUser } from "@/lib/router/auth-guards";

export const Route = createFileRoute("/setup-security-question")({
  beforeLoad: async ({ context }) => {
    await requireAuthenticatedUser({
      queryClient: context.queryClient,
      skipSecurityQuestionCheck: true,
    });
  },
  component: SetupSecurityQuestionPage,
});

function SetupSecurityQuestionPage() {
  return (
    <PageWrapper
      title="Account recovery"
      subtitle="One more step before you get started."
    >
      <SetupSecurityQuestionForm />
    </PageWrapper>
  );
}
