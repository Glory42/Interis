import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  changeCurrentUserEmail,
  changeCurrentUserPassword,
} from "@/features/auth/api";
import { authKeys, useAuth } from "@/features/auth/hooks/useAuth";
import { isApiError } from "@/lib/api-client";

export const SettingsAuthSection = () => {
  const queryClient = useQueryClient();
  const { user, isUserLoading } = useAuth();

  const changeEmailMutation = useMutation({
    mutationFn: changeCurrentUserEmail,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authKeys.me });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: changeCurrentUserPassword,
  });

  const [newEmail, setNewEmail] = useState(() => user?.email ?? "");
  const [authEmailError, setAuthEmailError] = useState<string | null>(null);
  const [authEmailSuccess, setAuthEmailSuccess] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [revokeOtherSessions, setRevokeOtherSessions] = useState(true);
  const [authPasswordError, setAuthPasswordError] = useState<string | null>(
    null,
  );
  const [authPasswordSuccess, setAuthPasswordSuccess] = useState<string | null>(
    null,
  );

  if (isUserLoading || !user) {
    return (
      <div className=" border border-border/70 bg-card/60 p-4 text-sm text-muted-foreground">
        <p className="flex items-center gap-2">
          <Spinner /> Loading auth settings...
        </p>
      </div>
    );
  }

  const handleChangeEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthEmailError(null);
    setAuthEmailSuccess(null);

    const normalizedEmail = newEmail.trim().toLowerCase();
    if (normalizedEmail === user.email.toLowerCase()) {
      setAuthEmailSuccess("Email is already up to date.");
      return;
    }

    try {
      await changeEmailMutation.mutateAsync({
        newEmail: normalizedEmail,
      });
      setNewEmail(normalizedEmail);
      setAuthEmailSuccess("Email change request sent.");
    } catch (error) {
      if (isApiError(error)) {
        setAuthEmailError(error.message);
        return;
      }

      setAuthEmailError("Could not update email right now.");
    }
  };

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthPasswordError(null);
    setAuthPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setAuthPasswordError("New password and confirmation do not match.");
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
        revokeOtherSessions,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setAuthPasswordSuccess("Password changed.");
    } catch (error) {
      if (isApiError(error)) {
        setAuthPasswordError(error.message);
        return;
      }

      setAuthPasswordError("Could not change password right now.");
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Email</CardTitle>
          <CardDescription>Update your account email.</CardDescription>
        </CardHeader>

        <CardContent>
          <form className="space-y-4" onSubmit={handleChangeEmail}>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="new-email">
                New email
              </label>
              <Input
                id="new-email"
                type="email"
                value={newEmail}
                onChange={(event) => setNewEmail(event.target.value)}
                required
              />
            </div>

            {authEmailError ? (
              <p className=" border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {authEmailError}
              </p>
            ) : null}

            {authEmailSuccess ? (
              <p className=" border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">
                {authEmailSuccess}
              </p>
            ) : null}

            <Button type="submit" disabled={changeEmailMutation.isPending}>
              {changeEmailMutation.isPending ? "Updating..." : "Update email"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Change your account password.</CardDescription>
        </CardHeader>

        <CardContent>
          <form className="space-y-4" onSubmit={handleChangePassword}>
            <div className="space-y-1.5">
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="current-password"
              >
                Current password
              </label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="new-password">
                New password
              </label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="confirm-password"
              >
                Confirm new password
              </label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                className="h-4 w-4  border-border bg-input"
                checked={revokeOtherSessions}
                onChange={(event) => setRevokeOtherSessions(event.target.checked)}
              />
              Sign out from other sessions
            </label>

            {authPasswordError ? (
              <p className=" border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {authPasswordError}
              </p>
            ) : null}

            {authPasswordSuccess ? (
              <p className=" border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">
                {authPasswordSuccess}
              </p>
            ) : null}

            <Button type="submit" disabled={changePasswordMutation.isPending}>
              {changePasswordMutation.isPending ? "Updating..." : "Change password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
