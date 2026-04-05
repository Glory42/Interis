import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  normalizeUsername,
  validateUsernameInput,
} from "@/features/auth/username";
import { useUpdateMyProfile } from "@/features/profile/hooks/useProfile";
import { SettingsFavoriteGenresCard } from "@/features/settings/components/profile/SettingsFavoriteGenresCard";
import { SettingsTopFilmsCard } from "@/features/settings/components/profile/SettingsTopFilmsCard";
import { useProfileImageUpload } from "@/features/settings/hooks/useProfileImageUpload";
import { isApiError } from "@/lib/api-client";

export const SettingsProfileSection = () => {
  const { user, isUserLoading, updateIdentity, isUpdateIdentityPending } =
    useAuth();
  const updateProfileMutation = useUpdateMyProfile();

  const [username, setUsername] = useState(() => user?.username ?? "");
  const [bio, setBio] = useState(() => user?.bio ?? "");
  const [location, setLocation] = useState(() => user?.location ?? "");

  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameSuccess, setUsernameSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  const {
    avatarInputRef,
    backdropInputRef,
    acceptValue,
    isAvatarUploading,
    avatarUploadError,
    avatarUploadSuccess,
    isBackdropUploading,
    backdropUploadError,
    backdropUploadSuccess,
    openAvatarPicker,
    openBackdropPicker,
    handleAvatarFileChange,
    handleBackdropFileChange,
  } = useProfileImageUpload(user);

  if (isUserLoading || !user) {
    return (
      <div className=" border border-border/70 bg-card/60 p-4 text-sm text-muted-foreground">
        <p className="flex items-center gap-2">
          <Spinner /> Loading profile settings...
        </p>
      </div>
    );
  }

  const handleSaveUsername = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUsernameError(null);
    setUsernameSuccess(null);

    const normalizedUsername = normalizeUsername(username);
    if (normalizedUsername === user.username) {
      setUsernameSuccess("Username is already up to date.");
      return;
    }

    const usernameValidationError = validateUsernameInput(normalizedUsername);
    if (usernameValidationError) {
      setUsernameError(usernameValidationError);
      return;
    }

    try {
      await updateIdentity({
        username: normalizedUsername,
      });
      setUsernameSuccess("Username saved.");
    } catch (error) {
      if (isApiError(error)) {
        setUsernameError(error.message);
        return;
      }

      setUsernameError("Could not update username right now.");
    }
  };

  const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    try {
      await updateProfileMutation.mutateAsync({
        bio: bio.trim(),
        location: location.trim(),
      });
      setProfileSuccess("Profile details saved.");
    } catch (error) {
      if (isApiError(error)) {
        setProfileError(error.message);
        return;
      }

      setProfileError("Could not save profile details right now.");
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>Images</CardTitle>
          <CardDescription>
            Upload avatar and backdrop images directly to storage. JPEG, PNG,
            WebP up to 10MB.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-4 sm:grid-cols-2">
          <section className=" border border-border/70 bg-secondary/20 p-4">
            <h3 className="text-sm font-semibold text-foreground">Avatar image</h3>

            <div className="mt-3 flex items-center gap-3">
              {user.avatarUrl || user.image ? (
                <img
                  src={user.avatarUrl ?? user.image ?? undefined}
                  alt={`${user.username} avatar`}
                  className="h-14 w-14  border border-border/70 object-cover"
                />
              ) : (
                <span className="inline-flex h-14 w-14 items-center justify-center  border border-border/70 bg-muted text-xs text-muted-foreground">
                  No image
                </span>
              )}

              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isAvatarUploading}
                onClick={openAvatarPicker}
              >
                {isAvatarUploading ? "Uploading..." : "Upload avatar"}
              </Button>
            </div>

            <input
              ref={avatarInputRef}
              type="file"
              accept={acceptValue}
              className="hidden"
              onChange={handleAvatarFileChange}
            />

            {avatarUploadError ? (
              <p className="mt-3  border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {avatarUploadError}
              </p>
            ) : null}

            {avatarUploadSuccess ? (
              <p className="mt-3  border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">
                {avatarUploadSuccess}
              </p>
            ) : null}
          </section>

          <section className=" border border-border/70 bg-secondary/20 p-4">
            <h3 className="text-sm font-semibold text-foreground">Backdrop image</h3>

            <div className="mt-3 space-y-3">
              {user.backdropUrl ? (
                <img
                  src={user.backdropUrl}
                  alt=""
                  aria-hidden="true"
                  className="h-24 w-full  border border-border/70 object-cover"
                />
              ) : (
                <div className="flex h-24 w-full items-center justify-center  border border-dashed border-border/70 bg-muted/25 text-xs text-muted-foreground">
                  No backdrop image
                </div>
              )}

              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isBackdropUploading}
                onClick={openBackdropPicker}
              >
                {isBackdropUploading ? "Uploading..." : "Upload backdrop"}
              </Button>
            </div>

            <input
              ref={backdropInputRef}
              type="file"
              accept={acceptValue}
              className="hidden"
              onChange={handleBackdropFileChange}
            />

            {backdropUploadError ? (
              <p className="mt-3  border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {backdropUploadError}
              </p>
            ) : null}

            {backdropUploadSuccess ? (
              <p className="mt-3  border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">
                {backdropUploadSuccess}
              </p>
            ) : null}
          </section>
        </CardContent>
      </Card>

      <SettingsTopFilmsCard username={user.username} />

      <SettingsFavoriteGenresCard initialGenres={user.favoriteGenres} />

      <Card>
        <CardHeader>
          <CardTitle>Username</CardTitle>
          <CardDescription>
            Update your public username used across profile routes.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form className="space-y-4" onSubmit={handleSaveUsername}>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="username">
                Username
              </label>
              <Input
                id="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                minLength={USERNAME_MIN_LENGTH}
                maxLength={USERNAME_MAX_LENGTH}
                required
              />
            </div>

            {usernameError ? (
              <p className=" border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {usernameError}
              </p>
            ) : null}

            {usernameSuccess ? (
              <p className=" border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">
                {usernameSuccess}
              </p>
            ) : null}

            <Button type="submit" disabled={isUpdateIdentityPending}>
              {isUpdateIdentityPending ? "Saving..." : "Save username"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profile details</CardTitle>
          <CardDescription>Manage your profile bio and location.</CardDescription>
        </CardHeader>

        <CardContent>
          <form className="space-y-4" onSubmit={handleSaveProfile}>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="bio">
                Bio
              </label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                maxLength={300}
                placeholder="Tell people what you love watching..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="location">
                Location
              </label>
              <Input
                id="location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                maxLength={100}
                placeholder="Istanbul, Tokyo, Somewhere with good cinema"
              />
            </div>

            {profileError ? (
              <p className=" border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {profileError}
              </p>
            ) : null}

            {profileSuccess ? (
              <p className=" border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">
                {profileSuccess}
              </p>
            ) : null}

            <Button type="submit" disabled={updateProfileMutation.isPending}>
              {updateProfileMutation.isPending ? "Saving..." : "Save profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
