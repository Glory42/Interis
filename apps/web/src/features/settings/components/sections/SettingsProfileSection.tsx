import { useState, type FormEvent } from "react";
import { Camera, Globe } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  normalizeUsername,
  validateUsernameInput,
} from "@/features/auth/username";
import { useUpdateMyProfile } from "@/features/profile/hooks/useProfile";
import { useProfileImageUpload } from "@/features/settings/hooks/useProfileImageUpload";
import { isApiError } from "@/lib/api-client";

export const SettingsProfileSection = () => {
  const { user, isUserLoading, updateIdentity, isUpdateIdentityPending } = useAuth();
  const updateProfileMutation = useUpdateMyProfile();

  const [username, setUsername] = useState(() => user?.username ?? "");
  const [bio, setBio] = useState(() => user?.bio ?? "");
  const [location, setLocation] = useState(() => user?.location ?? "");

  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const {
    avatarInputRef,
    acceptValue,
    isAvatarUploading,
    avatarUploadError,
    avatarUploadSuccess,
    openAvatarPicker,
    handleAvatarFileChange,
  } = useProfileImageUpload(user);

  if (isUserLoading || !user) {
    return (
      <div className="border px-4 py-3 text-sm settings-shell-border settings-shell-muted settings-shell-panel">
        <p className="flex items-center gap-2">
          <Spinner /> Loading profile settings...
        </p>
      </div>
    );
  }

  const isSaving = isUpdateIdentityPending || updateProfileMutation.isPending;

  const handleSaveChanges = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSaveError(null);
    setSaveSuccess(null);

    const normalizedUsername = normalizeUsername(username);
    const normalizedBio = bio.trim();
    const normalizedLocation = location.trim();

    const usernameValidationError = validateUsernameInput(normalizedUsername);
    if (usernameValidationError) {
      setSaveError(usernameValidationError);
      return;
    }

    const hasUsernameChanged = normalizedUsername !== user.username;
    const hasBioChanged = normalizedBio !== (user.bio ?? "");
    const hasLocationChanged = normalizedLocation !== (user.location ?? "");

    if (!hasUsernameChanged && !hasBioChanged && !hasLocationChanged) {
      setSaveSuccess("No changes to save.");
      return;
    }

    try {
      if (hasUsernameChanged) {
        await updateIdentity({
          username: normalizedUsername,
        });
      }

      if (hasBioChanged || hasLocationChanged) {
        await updateProfileMutation.mutateAsync({
          bio: normalizedBio,
          location: normalizedLocation,
        });
      }

      setSaveSuccess("Profile settings saved.");
    } catch (error) {
      setSaveError(
        isApiError(error)
          ? error.message
          : "Could not save profile settings right now.",
      );
    }
  };

  const avatarImage = user.avatarUrl ?? null;
  const avatarInitial = user.username.slice(0, 1).toUpperCase() || "U";

  return (
    <div className="space-y-6">
      <form onSubmit={handleSaveChanges} className="border p-6 settings-shell-border settings-shell-panel">
        <p className="mb-6 text-lg font-bold text-foreground">Profile Info</p>

        <div className="flex flex-col gap-8 sm:flex-row">
          <div className="shrink-0 sm:w-40">
            <button
              type="button"
              onClick={openAvatarPicker}
              disabled={isAvatarUploading}
              className="group relative h-20 w-20 overflow-hidden rounded-full border-2 settings-shell-border"
              aria-label="Change avatar"
            >
              {avatarImage ? (
                <img
                  src={avatarImage}
                  alt={`${user.username} avatar`}
                  className="h-full w-full object-cover"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--primary) 8%, transparent)",
                  }}
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center font-mono text-3xl font-bold settings-shell-accent"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--primary) 8%, transparent)",
                  }}
                >
                  <span>{avatarInitial}</span>
                </div>
              )}

              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="h-5 w-5 text-white" aria-hidden="true" />
                <span className="text-[11px] font-medium text-white">
                  {isAvatarUploading ? "Uploading..." : "Change"}
                </span>
              </div>
            </button>

            <p className="mt-3 text-sm font-semibold text-foreground">{user.username}</p>
            <p className="mt-1 text-xs settings-shell-muted">JPEG, PNG or WebP · max 10MB</p>

            {avatarUploadError ? (
              <p className="mt-2 text-xs text-destructive">{avatarUploadError}</p>
            ) : null}

            {avatarUploadSuccess ? (
              <p className="mt-2 text-xs settings-shell-accent">{avatarUploadSuccess}</p>
            ) : null}

            <input
              ref={avatarInputRef}
              type="file"
              accept={acceptValue}
              className="hidden"
              onChange={handleAvatarFileChange}
            />
          </div>

          <div className="min-w-0 flex-1 space-y-3 border-t pt-6 sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0 settings-shell-row-border">
            <div>
              <label className="mb-1 block text-xs font-medium settings-shell-muted" htmlFor="settings-username">
                Username
              </label>
              <input
                id="settings-username"
                className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[color:var(--settings-shell-accent)] settings-shell-border settings-shell-input"
                placeholder="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                minLength={USERNAME_MIN_LENGTH}
                maxLength={USERNAME_MAX_LENGTH}
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium settings-shell-muted" htmlFor="settings-bio">
                Bio
              </label>
              <textarea
                id="settings-bio"
                rows={3}
                className="w-full resize-none rounded-lg border bg-transparent px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[color:var(--settings-shell-accent)] settings-shell-border settings-shell-input settings-shell-bio"
                placeholder="Write something about yourself..."
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                maxLength={300}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium settings-shell-muted" htmlFor="settings-location">
                Location
              </label>

              <div className="relative">
                <Globe
                  className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 settings-shell-muted"
                  aria-hidden="true"
                />
                <input
                  id="settings-location"
                  className="w-full rounded-lg border bg-transparent py-2 pl-8 pr-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[color:var(--settings-shell-accent)] settings-shell-border settings-shell-input"
                  placeholder="City, Country"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  maxLength={100}
                />
              </div>
            </div>

            {saveError ? (
              <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {saveError}
              </p>
            ) : null}

            {saveSuccess ? (
              <p role="status" className="border px-3 py-2 text-sm settings-shell-border settings-shell-accent settings-shell-active-pill">
                {saveSuccess}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSaving}
              className="rounded-full px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: "var(--settings-shell-accent)", color: "var(--primary-foreground)" }}
            >
              {isSaving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
