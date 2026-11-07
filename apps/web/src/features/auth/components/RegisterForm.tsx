import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { RESERVED_USERNAMES, USERNAME_MAX_LENGTH, normalizeUsername, validateUsernameInput } from "@/features/auth/username";
import { PASSWORD_MAX, PASSWORD_MIN, PASSWORD_RULES } from "@/features/auth/password";
import { AccountField, PasswordLengthHint } from "@/features/settings/components/account/AccountField";
import { isApiError } from "@/lib/api-client";

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const usernameError = (raw: string) => {
  const username = normalizeUsername(raw);
  if (RESERVED_USERNAMES.has(username)) return `"${username}" is reserved. Try another.`;
  return validateUsernameInput(username);
};

const emailError = (email: string) => (EMAIL_SHAPE.test(email.trim()) ? null : "That doesn't look like an email.");

// Fields are checked when you leave them; errors sit under the field, not in one box after submit.
export const RegisterForm = () => {
  const navigate = useNavigate();
  const { register, isRegisterPending } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({ username: false, email: false });
  const [formError, setFormError] = useState<string | null>(null);

  const errors = {
    username: touched.username && username ? usernameError(username) : null,
    email: touched.email && email ? emailError(email) : null,
  };
  const canSubmit = !usernameError(username) && !emailError(email) && password.length >= PASSWORD_MIN;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setTouched({ username: true, email: true });
    if (!canSubmit) return;

    try {
      await register({ username: normalizeUsername(username), email: email.trim(), password });
      // Every new account sets up its recovery question next.
      await navigate({ to: "/setup-security-question" });
    } catch (error) {
      setFormError(isApiError(error) ? error.message : "Unexpected error. Please try again.");
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <AccountField
        id="register-username"
        name="username"
        label="Username"
        prefix="/profile/"
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        maxLength={USERNAME_MAX_LENGTH}
        value={username}
        onValueChange={setUsername}
        onBlur={() => setTouched((current) => ({ ...current, username: true }))}
        error={errors.username}
      />
      <AccountField
        id="register-email"
        name="email"
        label="Email"
        type="email"
        inputMode="email"
        autoComplete="username"
        value={email}
        onValueChange={setEmail}
        onBlur={() => setTouched((current) => ({ ...current, email: true }))}
        error={errors.email}
      />
      <div>
        <AccountField
          id="register-password"
          name="password"
          label="Password"
          isPassword
          autoComplete="new-password"
          maxLength={PASSWORD_MAX}
          {...PASSWORD_RULES}
          value={password}
          onValueChange={setPassword}
        />
        <PasswordLengthHint length={password.length} />
      </div>

      {formError ? (
        <p role="alert" className="body-s text-[color:var(--danger)]">
          {formError}
        </p>
      ) : null}

      <Button className="w-full" size="md" type="submit" disabled={!canSubmit || isRegisterPending}>
        {isRegisterPending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
};
