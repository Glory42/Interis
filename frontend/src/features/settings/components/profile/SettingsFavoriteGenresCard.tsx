import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUpdateMyProfile } from "@/features/profile/hooks/useProfile";
import {
  FAVORITE_GENRE_OPTIONS,
  MAX_FAVORITE_GENRES,
} from "@/features/settings/model/settings.constants";
import { isApiError } from "@/lib/api-client";
import type { FavoriteGenre } from "@/types/api";

type SettingsFavoriteGenresCardProps = {
  initialGenres: FavoriteGenre[] | null | undefined;
};

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

export const SettingsFavoriteGenresCard = ({
  initialGenres,
}: SettingsFavoriteGenresCardProps) => {
  const updateProfileMutation = useUpdateMyProfile();
  const [selectedGenres, setSelectedGenres] = useState<FavoriteGenre[]>(
    toUniqueKnownGenres(initialGenres),
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

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
    <Card>
      <CardHeader>
        <CardTitle>Favorite genres</CardTitle>
        <CardDescription>
          Choose up to {MAX_FAVORITE_GENRES} genres to highlight on your profile.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {FAVORITE_GENRE_OPTIONS.map((genre) => {
            const isSelected = selectedGenres.includes(genre);

            return (
              <button
                key={genre}
                type="button"
                onClick={() => toggleGenre(genre)}
                className={
                  isSelected
                    ? "rounded-full border border-primary/45 bg-primary/15 px-3 py-1.5 text-xs font-medium text-primary"
                    : "rounded-full border border-border/65 bg-secondary/20 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                }
                aria-pressed={isSelected}
              >
                {genre}
              </button>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground">
          Selected {selectedGenres.length}/{MAX_FAVORITE_GENRES}
        </p>

        {saveError ? (
          <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {saveError}
          </p>
        ) : null}

        {saveSuccess ? (
          <p className="rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">
            {saveSuccess}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setSelectedGenres([]);
              setSaveError(null);
              setSaveSuccess(null);
            }}
            disabled={selectedGenres.length === 0 || updateProfileMutation.isPending}
          >
            Clear
          </Button>
          <Button
            type="button"
            onClick={() => {
              void handleSaveGenres();
            }}
            disabled={updateProfileMutation.isPending}
          >
            {updateProfileMutation.isPending ? "Saving..." : "Save genres"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
