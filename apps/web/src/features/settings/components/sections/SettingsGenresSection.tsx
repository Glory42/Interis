import { useState } from "react";
import { X } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useUpdateMyProfile } from "@/features/profile/hooks/useProfile";
import {
  FAVORITE_GENRE_OPTIONS,
  MAX_FAVORITE_GENRES,
} from "@/features/settings/model/settings.constants";
import { isApiError } from "@/lib/api-client";
import type { FavoriteGenre } from "@/types/api";

const toUniqueKnownGenres = (
  genres: FavoriteGenre[] | null | undefined,
): FavoriteGenre[] => {
  if (!genres || genres.length === 0) {
    return [];
  }

  const allowed = new Set(FAVORITE_GENRE_OPTIONS);
  const uniqueGenres: FavoriteGenre[] = [];
  const seen = new Set<FavoriteGenre>();

  for (const genre of genres) {
    if (!allowed.has(genre) || seen.has(genre)) {
      continue;
    }

    seen.add(genre);
    uniqueGenres.push(genre);
  }

  return uniqueGenres;
};

export const SettingsGenresSection = () => {
  const { user, isUserLoading } = useAuth();
  const updateProfileMutation = useUpdateMyProfile();

  const [selectedGenres, setSelectedGenres] = useState<FavoriteGenre[]>(() =>
    toUniqueKnownGenres(user?.favoriteGenres),
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  if (isUserLoading || !user) {
    return (
      <div className="border px-4 py-3 text-sm settings-shell-border settings-shell-muted settings-shell-panel">
        <p className="flex items-center gap-2">
          <Spinner /> Loading genre settings...
        </p>
      </div>
    );
  }

  const toggleGenre = (genre: FavoriteGenre) => {
    setSaveError(null);
    setSaveSuccess(null);

    setSelectedGenres((currentGenres) => {
      if (currentGenres.includes(genre)) {
        return currentGenres.filter((item) => item !== genre);
      }

      if (currentGenres.length >= MAX_FAVORITE_GENRES) {
        setSaveError(`You can select up to ${MAX_FAVORITE_GENRES} genres.`);
        return currentGenres;
      }

      return [...currentGenres, genre];
    });
  };

  const handleSaveGenres = async () => {
    setSaveError(null);
    setSaveSuccess(null);

    try {
      await updateProfileMutation.mutateAsync({
        favoriteGenres: selectedGenres,
      });
      setSaveSuccess("Favorite genres saved.");
    } catch (error) {
      setSaveError(
        isApiError(error)
          ? error.message
          : "Could not save favorite genres right now.",
      );
    }
  };

  return (
    <div className="border p-6 space-y-5 settings-shell-border settings-shell-panel">
      <div>
        <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] settings-shell-accent">
          Favorite Genres
        </p>
        <p className="font-mono text-[10px] settings-shell-muted">
          Choose the genres that define your taste. These appear on your public profile.
        </p>
      </div>

      <div>
        <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.16em] settings-shell-muted">
          Selected ({selectedGenres.length})
        </p>

        <div className="mb-5 flex min-h-[32px] flex-wrap gap-2">
          {selectedGenres.length > 0 ? (
            selectedGenres.map((genre) => (
              <button
                key={`selected-${genre}`}
                type="button"
                onClick={() => toggleGenre(genre)}
                className="flex items-center gap-1 border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] transition-colors settings-shell-border settings-shell-accent settings-shell-active-pill"
              >
                <span>{genre}</span>
                <X className="h-2.5 w-2.5" aria-hidden="true" />
              </button>
            ))
          ) : (
            <p className="font-mono text-[10px] settings-shell-muted">No genres selected.</p>
          )}
        </div>

        <div className="border-t pt-4 settings-shell-row-border">
          <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.16em] settings-shell-muted">
            All Genres
          </p>

          <div className="flex flex-wrap gap-2">
            {FAVORITE_GENRE_OPTIONS.map((genre) => {
              const isSelected = selectedGenres.includes(genre);

              return (
                <button
                  key={`all-${genre}`}
                  type="button"
                  onClick={() => toggleGenre(genre)}
                  className={
                    "border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] transition-colors " +
                    (isSelected
                      ? "settings-shell-border settings-shell-accent settings-shell-active-pill"
                      : "settings-shell-border settings-shell-dim-text")
                  }
                >
                  {genre}
                </button>
              );
            })}
          </div>
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
        type="button"
        onClick={() => {
          void handleSaveGenres();
        }}
        disabled={updateProfileMutation.isPending}
        className="border px-5 py-2 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors settings-shell-border settings-shell-accent settings-shell-active-pill disabled:cursor-not-allowed disabled:opacity-60"
      >
        {updateProfileMutation.isPending ? "Saving..." : "Save Genres"}
      </button>
    </div>
  );
};
