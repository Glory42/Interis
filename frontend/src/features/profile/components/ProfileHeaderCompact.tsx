import { useMemo, useState, type ReactNode } from "react";
import { getProfileDisplayName } from "@/features/profile/utils/profile.utils";
import type { PublicProfile } from "@/types/api";

type ProfileHeaderCompactProps = {
  profile: PublicProfile;
  joinedLabel: string;
  headerAction?: ReactNode;
  actionError?: string | null;
  stats: {
    logged: number;
    reviews: number;
    following: number;
    followers: number;
  };
};

export const ProfileHeaderCompact = ({
  profile,
  joinedLabel,
  headerAction,
  actionError,
  stats,
}: ProfileHeaderCompactProps) => {
  const displayName = getProfileDisplayName(profile);
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);

  const avatarInitial = useMemo(() => {
    return profile.username.slice(0, 1).toUpperCase() || "U";
  }, [profile.username]);

  const rawAvatarUrl = profile.avatarUrl ?? profile.image ?? null;
  const avatarUrl =
    rawAvatarUrl && rawAvatarUrl !== failedAvatarUrl ? rawAvatarUrl : null;

  const favoriteGenres = profile.favoriteGenres ?? [];

  return (
    <div className="flex flex-col items-start gap-6 sm:flex-row">
      <div className="shrink-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Profile avatar"
            className="h-20 w-20 border-2 object-cover profile-shell-border"
            onError={() => {
              if (rawAvatarUrl) {
                setFailedAvatarUrl(rawAvatarUrl);
              }
            }}
            style={{
              backgroundColor:
                "color-mix(in srgb, var(--primary) 8%, transparent)",
            }}
          />
        ) : (
          <span
            className="inline-flex h-20 w-20 items-center justify-center border-2 font-mono text-2xl font-bold profile-shell-accent profile-shell-border"
            style={{
              backgroundColor:
                "color-mix(in srgb, var(--primary) 8%, transparent)",
            }}
          >
            {avatarInitial.toLowerCase()}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-xl font-bold text-foreground">
            {displayName}
          </h1>
          <span className="font-mono text-sm profile-shell-accent">
            @{profile.username}
          </span>
          <span className="border px-2 py-0.5 font-mono text-[9px] tracking-[0.16em] profile-shell-border profile-shell-muted">
            since {joinedLabel}
          </span>
          {headerAction ? <div>{headerAction}</div> : null}
        </div>

        {actionError ? (
          <p className="mb-2 border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {actionError}
          </p>
        ) : null}

        <div className="mt-2 flex items-start gap-2">
          <p className="profile-shell-muted profile-shell-bio flex-1 text-sm leading-relaxed">
            {profile.bio?.trim().length ? profile.bio : "No bio yet."}
          </p>
        </div>

        <div className="mt-5 flex flex-wrap items-end gap-x-8 gap-y-3">
          <div>
            <p className="font-mono text-lg font-bold text-foreground">
              {stats.reviews}
            </p>
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] profile-shell-muted">
              Reviews
            </p>
          </div>

          <div>
            <p className="font-mono text-lg font-bold text-foreground">
              {stats.following}
            </p>
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] profile-shell-muted">
              Following
            </p>
          </div>

          <div>
            <p className="font-mono text-lg font-bold text-foreground">
              {stats.followers}
            </p>
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] profile-shell-muted">
              Followers
            </p>
          </div>

          <div>
            <p className="font-mono text-lg font-bold text-foreground">
              {stats.logged}
            </p>
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] profile-shell-muted">
              Logged
            </p>
          </div>

          <div className="ml-2 flex flex-wrap items-center gap-1.5 pb-0.5">
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] profile-shell-muted">
              Genres:
            </span>
            {favoriteGenres.length > 0 ? (
              favoriteGenres.map((genre) => (
                <span
                  key={genre}
                  className="border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] profile-shell-accent profile-shell-border"
                >
                  {genre}
                </span>
              ))
            ) : (
              <span className="font-mono text-[10px] profile-shell-muted">
                None
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
