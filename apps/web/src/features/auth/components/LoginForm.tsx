import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { AccountField } from "@/features/settings/components/account/AccountField";
import { isApiError } from "@/lib/api-client";
import { normalizeInternalRedirectPath } from "@/lib/router/redirect";
import { authQueryOptions, useAuth } from "@/features/auth/hooks/useAuth";

type LoginFormProps = {
  redirectTo?: string;
};

export const LoginForm = ({ redirectTo }: LoginFormProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { login, isLoginPending } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isMismatch, setIsMismatch] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setIsMismatch(false);

    try {
      await login({ email, password });

      const freshUser = await queryClient.fetchQuery({ ...authQueryOptions, retry: false });
      if (freshUser && !freshUser.hasSecurityQuestion) {
        await navigate({ to: "/setup-security-question" });
        return;
      }

      const safeRedirectPath = normalizeInternalRedirectPath(redirectTo);
      if (safeRedirectPath) {
        window.location.assign(safeRedirectPath);
        return;
      }

      await navigate({ to: "/" });
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        setIsMismatch(true);
        return;
      }
      if (isApiError(error)) {
        setFormError(error.message);
        return;
      }

      setFormError("Unexpected error. Please try again.");
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <AccountField
        id="login-email"
        name="email"
        label="Email"
        type="email"
        inputMode="email"
        autoComplete="username"
        value={email}
        onValueChange={setEmail}
        required
      />
      <div>
        <AccountField
          id="login-password"
          name="password"
          label="Password"
          isPassword
          autoComplete="current-password"
          value={password}
          onValueChange={setPassword}
          required
        />
        <Link to="/forgot-password" className="body-s mt-1 inline-block text-muted-foreground hover:text-primary">
          Forgot it?
        </Link>
      </div>

      {isMismatch ? (
        <p role="alert" className="body-s text-[color:var(--danger)]">
          {"That email and password don't match. "}
          <Link to="/forgot-password" className="underline underline-offset-2">
            Recover your password
          </Link>
        </p>
      ) : formError ? (
        <p role="alert" className="body-s text-[color:var(--danger)]">
          {formError}
        </p>
      ) : null}

      <Button className="w-full" size="md" type="submit" disabled={isLoginPending}>
        {isLoginPending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
};
