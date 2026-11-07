import { SettingsSectionSkeleton } from "@/components/ui/PageSkeletons";
import { useState, type ReactNode } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { EmailForm, PasswordForm, RecoveryQuestionForm } from "@/features/settings/components/account/AccountForms";
import { maskEmail } from "@/features/settings/model/mask-email";

type OpenForm = "email" | "password" | "question" | null;

type RowProps = {
  label: string;
  value: string;
  action: string;
  actionLabel: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
};

const AccountRow = ({ label, value, action, actionLabel, isOpen, onToggle, children }: RowProps) => (
  <div className="border-b border-[color:var(--line)] py-3">
    <div className="flex items-center gap-3">
      <span className="body w-36 shrink-0 text-foreground">{label}</span>
      <span className="body-s min-w-0 flex-1 truncate text-muted-foreground">{isOpen ? "editing ↓" : value}</span>
      <button type="button" aria-label={actionLabel} aria-expanded={isOpen} onClick={onToggle} className="body-s text-primary hover:underline">
        {isOpen ? "Close" : action}
      </button>
    </div>
    {isOpen ? <div className="mt-3 max-w-md">{children}</div> : null}
  </div>
);

// One form opens at a time; each asks for the current password the same way.
export const SettingsAuthSection = () => {
  const { user, isUserLoading } = useAuth();
  const [openForm, setOpenForm] = useState<OpenForm>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (isUserLoading || !user) {
    return <SettingsSectionSkeleton label="Loading account settings" />;
  }

  const toggle = (form: Exclude<OpenForm, null>) => () => {
    setNotice(null);
    setOpenForm((current) => (current === form ? null : form));
  };
  const close = () => setOpenForm(null);
  const done = (message: string) => {
    setOpenForm(null);
    setNotice(message);
  };

  return (
    <div>
      <section>
        <h2 className="display-4 text-foreground">Account &amp; security</h2>
        <div className="mt-3 border-t border-[color:var(--line)]">
          <AccountRow label="Email" value={maskEmail(user.email)} action="Change" actionLabel="Change email" isOpen={openForm === "email"} onToggle={toggle("email")}>
            <EmailForm onClose={close} onDone={done} />
          </AccountRow>
          <AccountRow label="Password" value="••••••••" action="Change" actionLabel="Change password" isOpen={openForm === "password"} onToggle={toggle("password")}>
            <PasswordForm onClose={close} onDone={done} />
          </AccountRow>
          <AccountRow
            label="Recovery question"
            value={user.hasSecurityQuestion ? "Set" : "Not set"}
            action={user.hasSecurityQuestion ? "Replace" : "Set up"}
            actionLabel={user.hasSecurityQuestion ? "Replace recovery question" : "Set up recovery question"}
            isOpen={openForm === "question"}
            onToggle={toggle("question")}
          >
            <RecoveryQuestionForm onClose={close} onDone={done} isReplacing={user.hasSecurityQuestion} />
          </AccountRow>
        </div>
        {notice ? <p className="body-s mt-3 text-primary">{notice}</p> : null}
      </section>
    </div>
  );
};
