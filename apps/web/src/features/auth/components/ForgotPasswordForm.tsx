import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useRequestPasswordReset, useResetPassword } from "@/features/auth/hooks/useAuth";
import { PASSWORD_MAX, PASSWORD_MIN, PASSWORD_RULES } from "@/features/auth/password";
import { AccountField, PasswordLengthHint } from "@/features/settings/components/account/AccountField";
import { maskEmail } from "@/features/settings/model/mask-email";
import { isApiError } from "@/lib/api-client";

const errorOf = (error: unknown) => (isApiError(error) ? error.message : "Unexpected error. Please try again.");

const StepLabel = ({ step }: { step: 1 | 2 | 3 }) => <p className="mono-meta mb-3 uppercase text-muted-foreground">{`Step ${step} of 3`}</p>;

const FormError = ({ message }: { message: string | null }) =>
  message ? (
    <p role="alert" className="body-s text-[color:var(--danger)]">
      {message}
    </p>
  ) : null;

// Email → question and new password → done.
export const ForgotPasswordForm = () => {
  const navigate = useNavigate();
  const { mutateAsync: requestReset, isPending: isLookupPending } = useRequestPasswordReset();
  const { mutateAsync: resetPassword, isPending: isResetPending } = useResetPassword();

  const [email, setEmail] = useState("");
  const [question, setQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  const handleLookup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    try {
      setQuestion(await requestReset({ email: email.trim() }));
    } catch (error) {
      setFormError(errorOf(error));
    }
  };

  const handleReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    try {
      await resetPassword({ email: email.trim(), answer, newPassword });
      setIsDone(true);
    } catch (error) {
      setFormError(errorOf(error));
    }
  };

  if (isDone) {
    return (
      <div className="space-y-4">
        <StepLabel step={3} />
        <h2 className="display-3 text-foreground">Password updated</h2>
        <p className="body-s text-muted-foreground">You've been signed out everywhere. Sign in with the new password.</p>
        <Button className="w-full" size="md" onClick={() => void navigate({ to: "/login" })}>
          Go to sign in
        </Button>
      </div>
    );
  }

  if (question) {
    return (
      <form className="space-y-4" onSubmit={handleReset}>
        <StepLabel step={2} />
        <p className="body-s text-muted-foreground">
          <span>{maskEmail(email.trim())}</span>
          {" · "}
          <button
            type="button"
            aria-label="Change email"
            onClick={() => {
              setQuestion(null);
              setFormError(null);
            }}
            className="text-primary hover:underline"
          >
            change
          </button>
        </p>
        <div>
          <p className="kicker mb-1 text-muted-foreground">Your question</p>
          <p className="body text-foreground">{`“${question}”`}</p>
        </div>
        {/* Saves the new password against the right account in password managers. */}
        <input type="email" name="email" autoComplete="username" value={email.trim()} readOnly hidden />
        <AccountField id="forgot-password-answer" name="answer" label="Answer" autoComplete="off" maxLength={200} value={answer} onValueChange={setAnswer} required />
        <div>
          <AccountField
            id="forgot-password-new-password"
            name="newPassword"
            label="New password"
            isPassword
            autoComplete="new-password"
            maxLength={PASSWORD_MAX}
            {...PASSWORD_RULES}
            value={newPassword}
            onValueChange={setNewPassword}
            required
          />
          <PasswordLengthHint length={newPassword.length} />
        </div>
        <FormError message={formError} />
        <Button className="w-full" size="md" type="submit" disabled={isResetPending || !answer.trim() || newPassword.length < PASSWORD_MIN}>
          {isResetPending ? "Updating…" : "Set new password"}
        </Button>
        <p className="body-s text-muted-foreground">This signs you out on every device.</p>
      </form>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleLookup}>
      <StepLabel step={1} />
      <AccountField
        id="forgot-password-email"
        name="email"
        label="Email"
        type="email"
        inputMode="email"
        autoComplete="username"
        value={email}
        onValueChange={setEmail}
        required
      />
      <FormError message={formError} />
      <Button className="w-full" size="md" type="submit" disabled={isLookupPending || !email.trim()}>
        {isLookupPending ? "Looking up…" : "Continue"}
      </Button>
    </form>
  );
};
