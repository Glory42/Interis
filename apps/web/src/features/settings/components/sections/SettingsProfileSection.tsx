import { useState, type FormEvent } from "react";
import { Globe } from "lucide-react";
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

  const avatarImage = user.avatarUrl ?? user.image ?? null;
  const avatarInitial = user.username.slice(0, 1).toUpperCase() || "U";

  return (
    <div className="space-y-6">
      <form onSubmit={handleSaveChanges} className="border p-6 space-y-5 settings-shell-border settings-shell-panel">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] settings-shell-accent">
          Profile Info
        </p>

        <div>
          <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.16em] settings-shell-muted">
            Avatar
          </p>

          <div className="flex items-center gap-4">
            {avatarImage ? (
              <img
                src={avatarImage}
                alt={`${user.username} avatar`}
                className="h-16 w-16 shrink-0 border-2 object-cover settings-shell-border"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--primary) 8%, transparent)",
                }}
              />
            ) : (
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center border-2 font-mono text-2xl font-bold settings-shell-border settings-shell-accent"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--primary) 8%, transparent)",
                }}
              >
                <span>{avatarInitial}</span>
              </div>
            )}

            <div className="space-y-2">
              <button
                type="button"
                className="block border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors settings-shell-border settings-shell-dim-text hover:text-foreground"
                onClick={openAvatarPicker}
                disabled={isAvatarUploading}
              >
                {isAvatarUploading ? "Uploading..." : "Upload Image"}
              </button>
              <p className="font-mono text-[9px] settings-shell-muted">
                JPEG, PNG or WebP · max 10MB
              </p>
            </div>
          </div>

          <input
            ref={avatarInputRef}
            type="file"
            accept={acceptValue}
            className="hidden"
            onChange={handleAvatarFileChange}
          />

          {avatarUploadError ? (
            <p className="mt-3 border border-destructive/40 bg-destructive/10 px-3 py-2 font-mono text-xs text-destructive">
              {avatarUploadError}
            </p>
          ) : null}

          {avatarUploadSuccess ? (
            <p className="mt-3 border px-3 py-2 font-mono text-xs settings-shell-border settings-shell-accent settings-shell-active-pill">
              {avatarUploadSuccess}
            </p>
          ) : null}
        </div>

        <div>
          <label
            className="mb-2 block font-mono text-[9px] uppercase tracking-[0.16em] settings-shell-muted"
            htmlFor="settings-username"
          >
            Username
          </label>
          <input
            id="settings-username"
            className="w-full border bg-transparent px-3 py-2 font-mono text-xs text-foreground focus:outline-none settings-shell-border settings-shell-input"
            placeholder="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            minLength={USERNAME_MIN_LENGTH}
            maxLength={USERNAME_MAX_LENGTH}
            required
          />
        </div>

        <div>
          <label
            className="mb-2 block font-mono text-[9px] uppercase tracking-[0.16em] settings-shell-muted"
            htmlFor="settings-bio"
          >
            Bio
          </label>
          <textarea
            id="settings-bio"
            rows={3}
            className="w-full resize-none border bg-transparent px-3 py-2 font-mono text-xs text-foreground focus:outline-none settings-shell-border settings-shell-input settings-shell-bio"
            placeholder="Write something about yourself..."
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            maxLength={300}
          />
        </div>

        <div>
          <label
            className="mb-2 block font-mono text-[9px] uppercase tracking-[0.16em] settings-shell-muted"
            htmlFor="settings-location"
          >
            Location
          </label>

          <div className="relative">
            <Globe
              className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 settings-shell-muted"
              aria-hidden="true"
            />
            <input
              id="settings-location"
              className="w-full border bg-transparent py-2 pl-8 pr-3 font-mono text-xs text-foreground focus:outline-none settings-shell-border settings-shell-input"
              placeholder="City, Country"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              maxLength={100}
            />
          </div>
        </div>

        {saveError ? (
          <p className="border border-destructive/40 bg-destructive/10 px-3 py-2 font-mono text-xs text-destructive">
            {saveError}
          </p>
        ) : null}

        {saveSuccess ? (
          <p className="border px-3 py-2 font-mono text-xs settings-shell-border settings-shell-accent settings-shell-active-pill">
            {saveSuccess}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSaving}
          className="border px-5 py-2 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors settings-shell-border settings-shell-accent settings-shell-active-pill disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
};
