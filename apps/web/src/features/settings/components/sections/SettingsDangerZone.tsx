import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { deleteCurrentUserAccount } from "@/features/auth/api";
import { authKeys, useAuth } from "@/features/auth/hooks/useAuth";
import { AccountField } from "@/features/settings/components/account/AccountField";
import { isApiError } from "@/lib/api-client";

// The password is the confirmation; the server checks it before deleting anything (#136).
export const SettingsDangerZone = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");

  const deleteMutation = useMutation({
    mutationFn: deleteCurrentUserAccount,
    onSuccess: async () => {
      // Nothing cached belongs to anyone anymore.
      queryClient.clear();
      queryClient.setQueryData(authKeys.me, null);
      await navigate({ to: "/" });
    },
  });

  if (!user) return null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (password && !deleteMutation.isPending) deleteMutation.mutate(password);
  };

  return (
    <section id="delete-account" className="scroll-mt-20 rounded-[3px] border border-[color:var(--danger)]/50 p-4 sm:p-5">
      <h2 className="display-4 text-[color:var(--danger)]">Danger zone</h2>
      <p className="body-s mt-1 max-w-xl text-muted-foreground">
        {`Deletes @${user.username} with every log, review, list, post and comment. This can't be undone. `}
        <Link to="/settings/data" className="text-primary hover:underline">
          Download your diary first.
        </Link>
      </p>
      <form onSubmit={submit} className="mt-4 max-w-sm space-y-3">
        {/* Lets password managers pick the right account for the field below. */}
        <input type="text" name="username" autoComplete="username" value={user.username} readOnly hidden />
        <AccountField
          id="settings-delete-password"
          label="Your password, to confirm"
          isPassword
          autoComplete="current-password"
          value={password}
          onValueChange={(value) => {
            setPassword(value);
            if (deleteMutation.isError) deleteMutation.reset();
          }}
        />
        {deleteMutation.isError ? (
          <p role="alert" className="body-s text-[color:var(--danger)]">
            {`${isApiError(deleteMutation.error) ? deleteMutation.error.message : "Could not delete your account right now"}. Nothing was deleted.`}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={!password || deleteMutation.isPending}
          className="body-s rounded-[3px] border border-[color:var(--danger)] px-3.5 py-2 font-semibold text-[color:var(--danger)] hover:bg-[color:var(--danger)]/10 disabled:opacity-40"
        >
          {deleteMutation.isPending ? "Deleting…" : `Delete @${user.username} forever`}
        </button>
      </form>
    </section>
  );
};
