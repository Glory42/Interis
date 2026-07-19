import { Link, createFileRoute } from "@tanstack/react-router";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";
import { requireGuestUser } from "@/lib/router/auth-guards";

type ResetPasswordSearch = {
  token?: string;
};

const validateResetPasswordSearch = (
  search: Record<string, unknown>,
): ResetPasswordSearch => ({
  token: typeof search.token === "string" && search.token.length > 0 ? search.token : undefined,
});

export const Route = createFileRoute("/reset-password")({
  validateSearch: validateResetPasswordSearch,
  beforeLoad: async ({ context }) => {
    await requireGuestUser(context.queryClient);
  },
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token } = Route.useSearch();

  return (
    <PageWrapper title="Reset password" subtitle="Set a new password for your account.">
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <div className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            This reset link is missing or invalid.
          </p>
          <p className="text-center text-sm text-muted-foreground">
            <Link
              to="/forgot-password"
              className="font-semibold text-primary hover:text-primary/80"
            >
              Request a new link
            </Link>
          </p>
        </div>
      )}
    </PageWrapper>
  );
}
