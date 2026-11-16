import { memo, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { AccountSession } from "@/features/settings/api";
import {
  useAccountSessions,
  useRevokeAccountSession,
  useRevokeOtherAccountSessions,
} from "@/features/settings/hooks/useAccountSessions";
import { isApiError } from "@/lib/api-client";
import { formatDateLabel, formatRelativeTime } from "@/lib/time";

const errorOf = (error: unknown, fallback: string) => (isApiError(error) ? error.message : fallback);

type SessionRowProps = {
  session: AccountSession;
  isRevoking: boolean;
  onRevoke: (sessionId: string) => void;
};

const SessionRow = memo(({ session, isRevoking, onRevoke }: SessionRowProps) => {
  const lastActive = session.isCurrent ? "Active now" : `Active ${formatRelativeTime(session.lastActiveAt, { maxUnit: "year" })}`;
  const meta = [session.ipAddressMasked, lastActive, `Signed in ${formatDateLabel(session.createdAt)}`].filter(Boolean).join(" · ");

  return (
    <li className="flex items-center gap-3 border-b border-[color:var(--line)] py-3">
      <div className="min-w-0 flex-1">
        <p className="body flex flex-wrap items-center gap-2 text-foreground">
          <span className="truncate">{session.deviceLabel}</span>
          {session.isCurrent ? (
            <span className="mono-meta rounded-[2px] border border-primary/60 px-1.5 py-px uppercase text-primary">This device</span>
          ) : null}
        </p>
        <p className="mono-meta mt-0.5 text-muted-foreground">{meta}</p>
      </div>
      {session.isCurrent ? null : (
        <Button
          variant="outline"
          size="sm"
          loading={isRevoking}
          disabled={isRevoking}
          onClick={() => onRevoke(session.id)}
          aria-label={`Sign out ${session.deviceLabel}`}
        >
          Sign out
        </Button>
      )}
    </li>
  );
});
SessionRow.displayName = "SessionRow";

// Where the account is signed in; ending this device's session stays with the normal sign-out.
export const SettingsSessionsSection = () => {
  const sessionsQuery = useAccountSessions();
  const revokeMutation = useRevokeAccountSession();
  const revokeOthersMutation = useRevokeOtherAccountSessions();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const sessions = sessionsQuery.data?.sessions ?? [];
  const hasOtherSessions = sessions.some((session) => !session.isCurrent);

  const { mutate: revokeSession } = revokeMutation;
  // Stable so the memoized rows don't all re-render while one is revoking.
  const revokeOne = useCallback(
    (sessionId: string) => {
      setNotice(null);
      revokeSession(sessionId, { onSuccess: () => setNotice("Signed out that device.") });
    },
    [revokeSession],
  );

  const revokeOthers = (password?: string) => {
    if (!password) return;
    revokeOthersMutation.mutate(password, {
      onSuccess: ({ revokedCount }) => {
        setIsConfirmOpen(false);
        setNotice(revokedCount === 1 ? "Signed out 1 other session." : `Signed out ${revokedCount} other sessions.`);
      },
    });
  };

  const closeConfirm = () => {
    setIsConfirmOpen(false);
    revokeOthersMutation.reset();
  };

  return (
    <section aria-labelledby="settings-sessions-title" className="mt-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="settings-sessions-title" className="display-4 text-foreground">
          Where you&apos;re signed in
        </h2>
        {hasOtherSessions ? (
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              setNotice(null);
              setIsConfirmOpen(true);
            }}
          >
            Sign out all other sessions
          </Button>
        ) : null}
      </div>

      {sessionsQuery.isPending ? (
        <p className="body-s mt-3 text-muted-foreground">Loading sessions…</p>
      ) : sessionsQuery.isError ? (
        <p role="alert" className="body-s mt-3 text-[color:var(--danger)]">
          Could not load your sessions right now.
        </p>
      ) : (
        <ul className="mt-3 border-t border-[color:var(--line)]">
          {sessions.map((session) => (
            <SessionRow
              key={session.id}
              session={session}
              isRevoking={revokeMutation.isPending && revokeMutation.variables === session.id}
              onRevoke={revokeOne}
            />
          ))}
        </ul>
      )}

      {sessionsQuery.data?.hasMore ? (
        <p className="body-s mt-2 text-muted-foreground">Showing your most recent sessions.</p>
      ) : null}
      {revokeMutation.isError ? (
        <p role="alert" className="body-s mt-3 text-[color:var(--danger)]">
          {errorOf(revokeMutation.error, "Could not sign out that device right now.")}
        </p>
      ) : null}
      {notice ? <p className="body-s mt-3 text-primary">{notice}</p> : null}

      <ConfirmDialog
        isOpen={isConfirmOpen}
        context="Account · Sessions"
        title="Sign out all other sessions?"
        description="Every other browser and device signed in to this account is signed out. This one stays signed in."
        confirmLabel="Sign out others"
        isDestructive
        requirePassword
        isConfirming={revokeOthersMutation.isPending}
        error={revokeOthersMutation.isError ? errorOf(revokeOthersMutation.error, "Could not sign out other sessions right now.") : null}
        onConfirm={revokeOthers}
        onClose={closeConfirm}
      />
    </section>
  );
};
