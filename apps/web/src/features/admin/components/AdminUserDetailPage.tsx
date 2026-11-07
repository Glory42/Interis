import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { TickLoader } from "@/components/ui/tick-loader";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { AdminUserActions } from "@/features/admin/components/AdminUserActions";
import { useAdminUserDetail } from "@/features/admin/hooks/useAdminUserDetail";

const day = (date: Date) => date.toISOString().slice(0, 10);
const stamp = (date: Date) => date.toISOString().slice(0, 16).replace("T", " ");

const Credit = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex items-baseline gap-2 py-1">
    <span className="body-s text-foreground">{label}</span>
    <span aria-hidden className="min-w-3 flex-1 -translate-y-1 border-b border-dotted border-[color:var(--line-strong)]" />
    <span className="font-mono text-sm text-foreground">{children}</span>
  </div>
);

// "Firefox · Linux" from a user agent; enough to tell sessions apart.
const describeAgent = (agent: string | null) => {
  if (!agent) return "Unknown device";
  const browser = /Firefox\//.test(agent) ? "Firefox" : /Edg\//.test(agent) ? "Edge" : /Chrome\//.test(agent) ? "Chrome" : /Safari\//.test(agent) ? "Safari" : "Browser";
  const os = /iPhone|iPad/.test(agent) ? "iOS" : /Android/.test(agent) ? "Android" : /Mac OS/.test(agent) ? "macOS" : /Windows/.test(agent) ? "Windows" : /Linux/.test(agent) ? "Linux" : "Unknown OS";
  return `${browser} · ${os}`;
};

export const AdminUserDetailPage = ({ username }: { username: string }) => {
  const { user: me } = useAuth();
  const { data, isPending, isError } = useAdminUserDetail(username);

  if (isPending) {
    return (
      <p className="body-s flex items-center gap-2 text-muted-foreground">
        <TickLoader /> Loading @{username}…
      </p>
    );
  }
  if (isError) return <p className="body-s text-[color:var(--danger)]">Could not load this user.</p>;

  const { user, counts, sessions } = data;
  const isMe = me?.id === user.id;

  return (
    <div>
      <Link to="/admin/users" className="mono-meta uppercase text-muted-foreground hover:text-foreground">
        ← Users
      </Link>
      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="display-3 text-foreground">
          {`@${user.username}`}
          {user.isSuspended ? <span className="mono-meta ml-2 align-middle uppercase text-[color:var(--danger)]">suspended</span> : null}
        </h1>
        <span className="mono-meta uppercase text-muted-foreground">{`Joined ${day(user.createdAt)}`}</span>
      </div>
      <p className="body-s mt-1 text-muted-foreground">
        {`${user.email} · ${user.isAdmin ? "Admin" : "User"} · ${sessions.length} session${sessions.length === 1 ? "" : "s"}`}
      </p>

      <div className="mt-5 grid gap-8 lg:grid-cols-2">
        <div>
          <Credit label="Diary entries">{(counts.movieEntryCount + (counts.serialEntryCount ?? 0)).toLocaleString("en-US")}</Credit>
          <Credit label="Reviews · lists">{`${counts.reviewCount} · ${counts.listCount ?? 0}`}</Credit>
          <Credit label="Followers · following">{`${counts.followerCount ?? 0} · ${counts.followingCount ?? 0}`}</Credit>
          <Credit label="Reports against">{counts.reportsAgainst}</Credit>
          <Credit label="Reports filed">{counts.reportsFiled}</Credit>
        </div>
        <div>
          <h2 className="kicker mb-1 text-muted-foreground">Standing</h2>
          {user.isSuspended && user.suspendedAt ? (
            <>
              <Credit label="Suspended">{stamp(user.suspendedAt)}</Credit>
              <Credit label="Until">{user.suspendedUntil ? stamp(user.suspendedUntil) : "lifted by an admin"}</Credit>
              <Credit label="By">{user.suspendedBy ? `@${user.suspendedBy}` : "—"}</Credit>
              <Credit label="Reason">{user.suspendedReason ?? "—"}</Credit>
            </>
          ) : (
            <p className="body-s text-muted-foreground">In good standing.</p>
          )}
          {user.mustChangePassword ? <p className="body-s mt-1 text-muted-foreground">Must set a new password at next sign-in.</p> : null}

          <h2 className="kicker mt-5 mb-1 text-muted-foreground">Sessions</h2>
          {sessions.length === 0 ? (
            <p className="body-s text-muted-foreground">Signed out everywhere.</p>
          ) : (
            <ul>
              {sessions.map((session) => (
                <li key={session.id} className="body-s flex justify-between gap-2 border-b border-[color:var(--line)] py-1.5">
                  <span className="text-foreground">{describeAgent(session.userAgent)}</span>
                  <span className="font-mono text-xs text-muted-foreground">{`${session.ipAddress ?? "—"} · ${stamp(session.lastActiveAt)}`}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-6 border-t border-[color:var(--line)] pt-4">
        {isMe ? <p className="body-s text-muted-foreground">This is your account; act on it from Settings.</p> : <AdminUserActions user={user} />}
      </div>
    </div>
  );
};
