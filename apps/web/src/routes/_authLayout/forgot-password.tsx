import { Link, createFileRoute } from "@tanstack/react-router";
import { AuthPageHeader } from "@/features/auth/components/AuthPageHeader";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";
import { requireGuestUser } from "@/lib/router/auth-guards";

export const Route = createFileRoute("/_authLayout/forgot-password")({
  beforeLoad: async ({ context }) => {
    await requireGuestUser(context.queryClient);
  },
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  return (
    <>
      <AuthPageHeader title="Forgot password" subtitle="We'll help you get back in." />
      <div className="space-y-4">
        <ForgotPasswordForm />
        <p className="text-sm text-muted-foreground">
          Remembered it?{" "}
          <Link to="/login" className="font-semibold text-primary hover:text-primary/80">
            Sign in
          </Link>
        </p>
      </div>
    </>
  );
}
