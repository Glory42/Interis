import { useMemo, useState, type ReactNode } from "react";
import { Award, CalendarDays, Globe } from "lucide-react";
import type { PublicProfile } from "@/types/api";
import { getProfileDisplayName } from "@/features/profile/utils/profile.utils";

type ProfileHeroProps = {
  profile: PublicProfile;
  joinedLabel: string;
  headerAction?: ReactNode;
  actionError?: string | null;
};

export const ProfileHero = ({
  profile,
  joinedLabel,
  headerAction,
  actionError,
}: ProfileHeroProps) => {
  const displayName = getProfileDisplayName(profile);
  const [failedBackdropUrl, setFailedBackdropUrl] = useState<string | null>(null);
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);

  const avatarInitial = useMemo(() => {
    return profile.username.slice(0, 1).toUpperCase() || "U";
  }, [profile.username]);

  const rawAvatarUrl = profile.avatarUrl ?? profile.image ?? null;
  const avatarUrl = rawAvatarUrl && rawAvatarUrl !== failedAvatarUrl ? rawAvatarUrl : null;

  const rawBackdropUrl = profile.backdropUrl ?? null;
  const backdropUrl =
    rawBackdropUrl && rawBackdropUrl !== failedBackdropUrl ? rawBackdropUrl : null;

  return (
    <>
      <div className="theme-hero-shell relative h-60 overflow-hidden">
        {backdropUrl ? (
          <img
            src={backdropUrl}
            alt=""
            aria-hidden="true"
            className="theme-hero-media h-full w-full object-cover opacity-40"
            onError={() => {
              if (rawBackdropUrl) {
                setFailedBackdropUrl(rawBackdropUrl);
              }
            }}
          />
        ) : (
          <div className="theme-hero-media h-full w-full bg-secondary/40" />
        )}
        <div className="theme-hero-gradient-layer absolute inset-0" />
        <div className="theme-hero-pattern-layer absolute inset-0" />
        <div className="theme-hero-readable-overlay absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="relative z-10 -mt-20 mb-12 flex flex-col items-start gap-6 sm:flex-row sm:items-end">
          <div className="shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile avatar"
                className="h-32 w-32  border-4 border-border bg-card object-cover shadow-2xl"
                onError={() => {
                  if (rawAvatarUrl) {
                    setFailedAvatarUrl(rawAvatarUrl);
                  }
                }}
              />
            ) : (
              <span className="inline-flex h-32 w-32 items-center justify-center  border-4 border-border bg-card text-4xl font-black text-foreground shadow-2xl">
                {avatarInitial}
              </span>
            )}
          </div>

          <div className="flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <h1 className="theme-display-title text-4xl font-black tracking-tight text-foreground">
                  {displayName}
                </h1>
                <Award className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              {headerAction ? <div>{headerAction}</div> : null}
            </div>

            <p className="mb-4 font-mono text-sm text-muted-foreground">@{profile.username}</p>

            {actionError ? (
              <p className="mb-4  border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {actionError}
              </p>
            ) : null}

            <p className="mb-4 max-w-2xl leading-relaxed text-foreground/90">
              {profile.bio ?? "No bio added yet."}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{profile.location ?? "Location not set"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Joined {joinedLabel}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
