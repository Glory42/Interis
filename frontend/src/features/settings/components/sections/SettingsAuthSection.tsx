import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, LogOut } from "lucide-react";
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
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authPasswordError, setAuthPasswordError] = useState<string | null>(null);
  const [authPasswordSuccess, setAuthPasswordSuccess] = useState<string | null>(null);

  if (isUserLoading || !user) {
    return (
      <div className="border px-4 py-3 text-sm settings-shell-border settings-shell-muted settings-shell-panel">
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
      setAuthEmailError(
        isApiError(error) ? error.message : "Could not update email right now.",
      );
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
      setAuthPasswordError(
        isApiError(error)
          ? error.message
          : "Could not change password right now.",
      );
    }
  };

  const renderPasswordToggle = (
    isVisible: boolean,
    onToggle: () => void,
    label: string,
  ) => {
    const Icon = isVisible ? EyeOff : Eye;

    return (
      <button
        type="button"
        className="absolute right-3 top-1/2 -translate-y-1/2 settings-shell-muted transition-colors hover:text-foreground"
        onClick={onToggle}
        aria-label={label}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <div className="border p-6 space-y-5 settings-shell-border settings-shell-panel">
        <div>
          <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] settings-shell-accent">
            Email
          </p>
          <p className="mb-4 font-mono text-[10px] settings-shell-muted">
            Update your account email.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleChangeEmail}>
          <div>
            <label className="mb-1 block font-mono text-[9px] uppercase tracking-[0.16em] settings-shell-muted">
              Current Email
            </label>
            <p className="mb-4 font-mono text-xs settings-shell-dim-text">{user.email}</p>

            <label
              className="mb-2 block font-mono text-[9px] uppercase tracking-[0.16em] settings-shell-muted"
              htmlFor="settings-new-email"
            >
              New Email
            </label>
            <input
              id="settings-new-email"
              className="w-full border bg-transparent px-3 py-2 font-mono text-xs text-foreground focus:outline-none settings-shell-border settings-shell-input"
              placeholder="new@mail.com"
              type="email"
              value={newEmail}
              onChange={(event) => setNewEmail(event.target.value)}
              required
            />
          </div>

          {authEmailError ? (
            <p className="border border-destructive/40 bg-destructive/10 px-3 py-2 font-mono text-xs text-destructive">
              {authEmailError}
            </p>
          ) : null}

          {authEmailSuccess ? (
            <p className="border px-3 py-2 font-mono text-xs settings-shell-border settings-shell-accent settings-shell-active-pill">
              {authEmailSuccess}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={changeEmailMutation.isPending}
            className="border px-5 py-2 font-mono text-[10px] uppercase tracking-[0.16em] settings-shell-border settings-shell-accent settings-shell-active-pill disabled:cursor-not-allowed disabled:opacity-60"
          >
            {changeEmailMutation.isPending ? "Updating..." : "Update Email"}
          </button>
        </form>
      </div>

      <div className="border p-6 space-y-5 settings-shell-border settings-shell-panel">
        <div>
          <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] settings-shell-accent">
            Password
          </p>
          <p className="mb-4 font-mono text-[10px] settings-shell-muted">
            Change your account password.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleChangePassword}>
          <div>
            <label
              className="mb-2 block font-mono text-[9px] uppercase tracking-[0.16em] settings-shell-muted"
              htmlFor="settings-current-password"
            >
              Current Password
            </label>

            <div className="relative">
              <input
                id="settings-current-password"
                className="w-full border bg-transparent px-3 py-2 pr-9 font-mono text-xs text-foreground focus:outline-none settings-shell-border settings-shell-input"
                placeholder="••••••••"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
              {renderPasswordToggle(showCurrentPassword, () => {
                setShowCurrentPassword((prev) => !prev);
              }, "Toggle current password visibility")}
            </div>
          </div>

          <div>
            <label
              className="mb-2 block font-mono text-[9px] uppercase tracking-[0.16em] settings-shell-muted"
              htmlFor="settings-new-password"
            >
              New Password
            </label>

            <div className="relative">
              <input
                id="settings-new-password"
                className="w-full border bg-transparent px-3 py-2 pr-9 font-mono text-xs text-foreground focus:outline-none settings-shell-border settings-shell-input"
                placeholder="••••••••"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
              {renderPasswordToggle(showNewPassword, () => {
                setShowNewPassword((prev) => !prev);
              }, "Toggle new password visibility")}
            </div>
          </div>

          <div>
            <label
              className="mb-2 block font-mono text-[9px] uppercase tracking-[0.16em] settings-shell-muted"
              htmlFor="settings-confirm-password"
            >
              Confirm New Password
            </label>

            <div className="relative">
              <input
                id="settings-confirm-password"
                className="w-full border bg-transparent px-3 py-2 pr-9 font-mono text-xs text-foreground focus:outline-none settings-shell-border settings-shell-input"
                placeholder="••••••••"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
              {renderPasswordToggle(showConfirmPassword, () => {
                setShowConfirmPassword((prev) => !prev);
              }, "Toggle confirm password visibility")}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t pt-2 sm:flex-row settings-shell-row-border">
            <button
              type="button"
              className={
                "flex items-center gap-2 border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.16em] " +
                (revokeOtherSessions
                  ? "settings-shell-danger-option"
                  : "settings-shell-border settings-shell-dim-text")
              }
              onClick={() => {
                setRevokeOtherSessions((prev) => !prev);
              }}
            >
              <LogOut className="h-3 w-3" aria-hidden="true" />
              <span>Sign out from other sessions</span>
            </button>

            <button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="border px-5 py-2 font-mono text-[10px] uppercase tracking-[0.16em] settings-shell-border settings-shell-accent settings-shell-active-pill disabled:cursor-not-allowed disabled:opacity-60"
            >
              {changePasswordMutation.isPending ? "Updating..." : "Change Password"}
            </button>
          </div>

          {authPasswordError ? (
            <p className="border border-destructive/40 bg-destructive/10 px-3 py-2 font-mono text-xs text-destructive">
              {authPasswordError}
            </p>
          ) : null}

          {authPasswordSuccess ? (
            <p className="border px-3 py-2 font-mono text-xs settings-shell-border settings-shell-accent settings-shell-active-pill">
              {authPasswordSuccess}
            </p>
          ) : null}
        </form>
      </div>
    </div>
  );
};
