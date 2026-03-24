import { Link, Navigate, createFileRoute } from "@tanstack/react-router";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { useAuth } from "@/features/auth/hooks/useAuth";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const { user, isUserLoading } = useAuth();

  if (!isUserLoading && user) {
    return <Navigate to="/films" />;
  }

  return (
    <PageWrapper
      title="Create your account"
      subtitle="A username profile is created automatically with Better Auth + profiles table."
    >
      <div className="space-y-4">
        <RegisterForm />
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary hover:text-primary/80">
            Sign in
          </Link>
        </p>
      </div>
    </PageWrapper>
  );
}
