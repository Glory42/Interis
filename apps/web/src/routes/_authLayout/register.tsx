import { Link, createFileRoute } from "@tanstack/react-router";
import { AuthPageHeader } from "@/features/auth/components/AuthPageHeader";
import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { requireGuestUser } from "@/lib/router/auth-guards";

export const Route = createFileRoute("/_authLayout/register")({
  beforeLoad: async ({ context }) => {
    await requireGuestUser(context.queryClient);
  },
  component: RegisterPage,
});

function RegisterPage() {
  return (
    <>
      <AuthPageHeader title="Start your diary." subtitle="Pick a username once; your profile is ready straight away." />
      <RegisterForm />
      <p className="body-s mt-4 text-muted-foreground">
        {"Have one? "}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
