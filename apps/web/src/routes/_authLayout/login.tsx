import { Link, createFileRoute } from "@tanstack/react-router";
import { AuthPageHeader } from "@/features/auth/components/AuthPageHeader";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { requireGuestUser } from "@/lib/router/auth-guards";
import { normalizeInternalRedirectPath } from "@/lib/router/redirect";

type LoginSearch = {
  redirect?: string;
};

const validateLoginSearch = (search: Record<string, unknown>): LoginSearch => ({
  redirect: normalizeInternalRedirectPath(search.redirect) ?? undefined,
});

export const Route = createFileRoute("/_authLayout/login")({
  validateSearch: validateLoginSearch,
  beforeLoad: async ({ context }) => {
    await requireGuestUser(context.queryClient);
  },
  component: LoginPage,
});

function LoginPage() {
  const { redirect } = Route.useSearch();

  return (
    <>
      <AuthPageHeader title="Pick up where you left off." subtitle="Sign in with the email you joined with." />
      <LoginForm redirectTo={redirect} />
      <p className="body-s mt-4 text-muted-foreground">
        {"New here? "}
        <Link to="/register" className="font-semibold text-primary hover:underline">
          Start a diary
        </Link>
      </p>
    </>
  );
}
