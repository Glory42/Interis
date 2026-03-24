import { Link, Navigate, createFileRoute } from "@tanstack/react-router";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { useAuth } from "@/features/auth/hooks/useAuth";

type LoginSearch = {
  redirect?: string;
};

const validateLoginSearch = (search: Record<string, unknown>): LoginSearch => ({
  redirect: typeof search.redirect === "string" ? search.redirect : undefined,
});

export const Route = createFileRoute("/login")({
  validateSearch: validateLoginSearch,
  component: LoginPage,
});

function LoginPage() {
  const { redirect } = Route.useSearch();
  const { user, isUserLoading } = useAuth();

  if (!isUserLoading && user) {
    return <Navigate to="/films" />;
  }

  return (
    <PageWrapper title="Sign in" subtitle="Continue your diary from where you left off.">
      <div className="space-y-4">
        <LoginForm redirectTo={redirect} />
        <p className="text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link to="/register" className="font-semibold text-primary hover:text-primary/80">
            Create an account
          </Link>
        </p>
      </div>
    </PageWrapper>
  );
}
