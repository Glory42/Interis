import { createFileRoute } from "@tanstack/react-router";
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
    <section className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="overflow-hidden rounded-[3px] border border-[color:var(--line)]">
        <div className="slate mono-meta uppercase">
          <span>Interis · One last step</span>
          <span />
        </div>
        <div className="max-w-md p-5 sm:p-8">
          <SetupSecurityQuestionForm />
        </div>
      </div>
    </section>
  );
}
