import { useState, type FormEvent } from "react";
import { Navigate, createFileRoute } from "@tanstack/react-router";
import { PageWrapper } from "@/components/layout/PageWrapper";
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
  useUpdateMyProfile,
  useUpdateMyUsername,
} from "@/features/profile/hooks/useProfile";
import { isApiError } from "@/lib/api-client";
import type { MeProfile } from "@/types/api";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

const isValidUrl = (value: string): boolean => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

function SettingsPage() {
  const { user, isUserLoading } = useAuth();

  if (isUserLoading) {
    return (
      <PageWrapper>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner /> Loading settings...
        </div>
      </PageWrapper>
    );
  }

  if (!user) {
    return <Navigate to="/login" search={{ redirect: "/settings" }} />;
  }

  return <SettingsContent user={user} />;
}

type SettingsContentProps = {
  user: MeProfile;
};

const SettingsContent = ({ user }: SettingsContentProps) => {
  const updateProfileMutation = useUpdateMyProfile();
  const updateUsernameMutation = useUpdateMyUsername();

  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio ?? "");
  const [location, setLocation] = useState(user.location ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");
  const [backdropUrl, setBackdropUrl] = useState(user.backdropUrl ?? "");

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const normalizedUsername = username.trim();
    const normalizedAvatar = avatarUrl.trim();
    const normalizedBackdrop = backdropUrl.trim();

    if (!/^[a-zA-Z0-9_]{3,50}$/.test(normalizedUsername)) {
      setFormError(
        "Username must be 3-50 chars and only letters, numbers, underscores.",
      );
      return;
    }

    if (normalizedAvatar.length > 0 && !isValidUrl(normalizedAvatar)) {
      setFormError("Avatar URL is not valid.");
      return;
    }

    if (normalizedBackdrop.length > 0 && !isValidUrl(normalizedBackdrop)) {
      setFormError("Backdrop URL is not valid.");
      return;
    }

    try {
      if (normalizedUsername !== user.username) {
        const usernameResult = await updateUsernameMutation.mutateAsync({
          username: normalizedUsername,
        });

        if (usernameResult.error) {
          setFormError(usernameResult.error);
          return;
        }
      }

      await updateProfileMutation.mutateAsync({
        bio: bio.trim(),
        location: location.trim(),
        ...(normalizedAvatar.length > 0 ? { avatarUrl: normalizedAvatar } : {}),
        ...(normalizedBackdrop.length > 0 ? { backdropUrl: normalizedBackdrop } : {}),
      });

      setFormSuccess("Profile settings saved.");
    } catch (error) {
      if (isApiError(error)) {
        setFormError(error.message);
        return;
      }

      setFormError("Could not save settings right now.");
    }
  };

  const isSaving = updateProfileMutation.isPending || updateUsernameMutation.isPending;

  return (
    <PageWrapper
      title="Settings"
      subtitle="Update your public profile and username from one form."
    >
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Profile settings</CardTitle>
          <CardDescription>
            This form updates both username and profile information.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          <form className="space-y-4" onSubmit={handleSave}>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="username">
                Username
              </label>
              <Input
                id="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                minLength={3}
                maxLength={50}
                required
              />
            </div>

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

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="avatar-url">
                Avatar URL
              </label>
              <Input
                id="avatar-url"
                value={avatarUrl}
                onChange={(event) => setAvatarUrl(event.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="backdrop-url">
                Backdrop URL
              </label>
              <Input
                id="backdrop-url"
                value={backdropUrl}
                onChange={(event) => setBackdropUrl(event.target.value)}
                placeholder="https://..."
              />
            </div>

            {formError ? (
              <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {formError}
              </p>
            ) : null}

            {formSuccess ? (
              <p className="rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">
                {formSuccess}
              </p>
            ) : null}

            <Button type="submit" size="sm" className="sm:h-10 sm:px-4" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </PageWrapper>
  );
};
