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
      <AuthPageHeader title="Get back in." subtitle="Interis doesn't send reset emails. Your recovery question is the way back." />
      <ForgotPasswordForm />
      <p className="body-s mt-4 text-muted-foreground">
        {"Remembered it? "}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
