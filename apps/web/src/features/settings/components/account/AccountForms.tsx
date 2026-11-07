import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { changeCurrentUserEmail, changeCurrentUserPassword } from "@/features/auth/api";
import { authKeys, useSetSecurityQuestion } from "@/features/auth/hooks/useAuth";
import { isApiError } from "@/lib/api-client";
import { PASSWORD_MAX, PASSWORD_MIN, PASSWORD_RULES } from "@/features/auth/password";
import { AccountField, PasswordLengthHint } from "./AccountField";

type FormProps = { onClose: () => void; onDone: (message: string) => void };

const errorOf = (error: unknown, fallback: string) => (isApiError(error) ? error.message : fallback);

const FormActions = ({ onClose, submitLabel, disabled, isPending }: { onClose: () => void; submitLabel: string; disabled: boolean; isPending: boolean }) => (
  <div className="flex items-center justify-end gap-2">
    <Button type="button" variant="outline" size="md" onClick={onClose}>
      Cancel
    </Button>
    <Button type="submit" size="md" disabled={disabled || isPending}>
      {isPending ? "Saving…" : submitLabel}
    </Button>
  </div>
);

const FormError = ({ message }: { message: string | null }) =>
  message ? (
    <p role="alert" className="body-s text-[color:var(--danger)]">
      {message}
    </p>
  ) : null;

export const EmailForm = ({ onClose, onDone }: FormProps) => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: changeCurrentUserEmail,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: authKeys.me }),
  });
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await mutation.mutateAsync({ newEmail: newEmail.trim().toLowerCase(), currentPassword: password });
      onDone("Email updated.");
    } catch (caught) {
      setError(errorOf(caught, "Could not update email right now."));
    }
  };

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-3">
      <AccountField id="settings-new-email" label="New email" type="email" autoComplete="email" value={newEmail} onValueChange={setNewEmail} />
      <AccountField id="settings-email-password" label="Current password" isPassword autoComplete="current-password" value={password} onValueChange={setPassword} />
      <FormError message={error} />
      <FormActions onClose={onClose} submitLabel="Save new email" disabled={!newEmail.trim() || !password} isPending={mutation.isPending} />
    </form>
  );
};

export const PasswordForm = ({ onClose, onDone }: FormProps) => {
  const mutation = useMutation({ mutationFn: changeCurrentUserPassword });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [revokeOtherSessions, setRevokeOtherSessions] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const remaining = PASSWORD_MIN - newPassword.length;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await mutation.mutateAsync({ currentPassword, newPassword, revokeOtherSessions });
      onDone("Password changed.");
    } catch (caught) {
      setError(errorOf(caught, "Could not change password right now."));
    }
  };

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-3">
      <AccountField id="settings-current-password" label="Current password" isPassword autoComplete="current-password" value={currentPassword} onValueChange={setCurrentPassword} />
      <div>
        <AccountField
          id="settings-new-password"
          label="New password"
          isPassword
          autoComplete="new-password"
          maxLength={PASSWORD_MAX}
          {...PASSWORD_RULES}
          value={newPassword}
          onValueChange={setNewPassword}
        />
        <PasswordLengthHint length={newPassword.length} />
      </div>
      <label className="body-s flex items-center gap-2 text-foreground">
        <input type="checkbox" checked={revokeOtherSessions} onChange={(event) => setRevokeOtherSessions(event.target.checked)} className="accent-[color:var(--primary)]" />
        Sign me out on my other devices
      </label>
      <FormError message={error} />
      <FormActions onClose={onClose} submitLabel="Save new password" disabled={!currentPassword || remaining > 0} isPending={mutation.isPending} />
    </form>
  );
};

export const RecoveryQuestionForm = ({ onClose, onDone, isReplacing }: FormProps & { isReplacing: boolean }) => {
  const mutation = useSetSecurityQuestion();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await mutation.mutateAsync({ question: question.trim(), answer: answer.trim(), ...(isReplacing ? { currentPassword: password } : {}) });
      onDone("Recovery question saved.");
    } catch (caught) {
      setError(errorOf(caught, "Could not save the recovery question right now."));
    }
  };

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-3">
      <AccountField id="settings-question" label="Question" maxLength={200} value={question} onValueChange={setQuestion} />
      <AccountField id="settings-answer" label="Answer" maxLength={200} autoComplete="off" value={answer} onValueChange={setAnswer} />
      {isReplacing ? (
        <AccountField id="settings-question-password" label="Current password" isPassword autoComplete="current-password" value={password} onValueChange={setPassword} />
      ) : null}
      <FormError message={error} />
      <FormActions
        onClose={onClose}
        submitLabel="Save question"
        disabled={question.trim().length < 4 || !answer.trim() || (isReplacing && !password)}
        isPending={mutation.isPending}
      />
    </form>
  );
};
