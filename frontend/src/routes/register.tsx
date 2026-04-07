import { Link, createFileRoute } from "@tanstack/react-router";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { requireGuestUser } from "@/lib/router/auth-guards";

export const Route = createFileRoute("/register")({
  beforeLoad: async ({ context }) => {
    await requireGuestUser(context.queryClient);
  },
  component: RegisterPage,
});

function RegisterPage() {
  return (
    <PageWrapper
      title="Create your account"
      subtitle="Choose your username once, and your profile is ready immediately."
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
