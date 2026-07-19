import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { isApiError } from "@/lib/api-client";
import { useRequestPasswordReset, useResetPassword } from "@/features/auth/hooks/useAuth";

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
      const foundQuestion = await requestReset({ email });
      setQuestion(foundQuestion);
    } catch (error) {
      if (isApiError(error)) {
        setFormError(error.message);
        return;
      }

      setFormError("Unexpected error. Please try again.");
    }
  };

  const handleReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    try {
      await resetPassword({ email, answer, newPassword });
      setIsDone(true);
    } catch (error) {
      if (isApiError(error)) {
        setFormError(error.message);
        return;
      }

      setFormError("Unexpected error. Please try again.");
    }
  };

  if (isDone) {
    return (
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle>Password updated</CardTitle>
          <CardDescription>
            You&apos;ve been signed out of all devices — sign in with your new password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => void navigate({ to: "/login" })}>
            Go to sign in
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (question) {
    return (
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle>Answer your security question</CardTitle>
          <CardDescription>{question}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleReset}>
            <div className="space-y-1.5">
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="forgot-password-answer"
              >
                Answer
              </label>
              <Input
                id="forgot-password-answer"
                name="answer"
                type="text"
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="forgot-password-new-password"
              >
                New password
              </label>
              <Input
                id="forgot-password-new-password"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                minLength={8}
                maxLength={128}
                required
              />
            </div>

            {formError ? (
              <p
                role="alert"
                className=" border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {formError}
              </p>
            ) : null}

            <Button className="w-full" type="submit" disabled={isResetPending}>
              {isResetPending ? "Updating..." : "Update password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>
          Enter your email — if it has a security question set up, we&apos;ll show it to you
          here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleLookup}>
          <div className="space-y-1.5">
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="forgot-password-email"
            >
              Email
            </label>
            <Input
              id="forgot-password-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          {formError ? (
            <p
              role="alert"
              className=" border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {formError}
            </p>
          ) : null}

          <Button className="w-full" type="submit" disabled={isLookupPending}>
            {isLookupPending ? "Looking up..." : "Continue"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
