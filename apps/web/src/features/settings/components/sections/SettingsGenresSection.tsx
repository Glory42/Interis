import { useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useUpdateMyProfile } from "@/features/profile/hooks/useProfile";
import {
  FAVORITE_GENRE_OPTIONS,
  MAX_FAVORITE_GENRES,
} from "@/features/settings/model/settings.constants";
import { isApiError } from "@/lib/api-client";
import type { FavoriteGenre } from "@/types/api";
import { TickLoader } from "@/components/ui/tick-loader";
import { cn } from "@/lib/utils";

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

  if (isUserLoading || !user) {
    return (
      <div className="border px-4 py-3 text-sm shell-border shell-muted surface">
        <p className="flex items-center gap-2">
          <TickLoader /> Loading genre settings...
        </p>
      </div>
    );
  }

  // Each tap saves on its own; a failed save puts the chips back.
  const toggleGenre = async (genre: FavoriteGenre) => {
    if (updateProfileMutation.isPending) return;
    const previous = selectedGenres;
    const next = previous.includes(genre) ? previous.filter((item) => item !== genre) : [...previous, genre];
    if (next.length > MAX_FAVORITE_GENRES) return;

    setSaveError(null);
    setSelectedGenres(next);
    try {
      await updateProfileMutation.mutateAsync({ favoriteGenres: next });
    } catch (error) {
      setSelectedGenres(previous);
      setSaveError(isApiError(error) ? error.message : "Could not save your genres right now.");
    }
  };

  const isFull = selectedGenres.length >= MAX_FAVORITE_GENRES;

  return (
    <section>
      <h2 className="display-4 text-foreground">Genres</h2>
      <p className="body mt-3 text-foreground">{toGenreSentence(selectedGenres)}</p>
      <p className="mono-meta mt-1 uppercase text-muted-foreground">
        {`${selectedGenres.length} / ${MAX_FAVORITE_GENRES} picked · saves as you tap`}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {FAVORITE_GENRE_OPTIONS.map((genre) => {
          const isSelected = selectedGenres.includes(genre);
          return (
            <button
              key={genre}
              type="button"
              aria-pressed={isSelected}
              disabled={!isSelected && isFull}
              onClick={() => void toggleGenre(genre)}
              className={cn(
                "body-s rounded-[2px] border px-2.5 py-1 transition-colors disabled:opacity-35",
                isSelected
                  ? "border-[color:var(--primary)] bg-primary/[0.12] text-foreground"
                  : "border-[color:var(--line)] text-muted-foreground hover:text-foreground",
              )}
            >
              {genre}
            </button>
          );
        })}
      </div>

      {saveError ? (
        <p role="alert" className="body-s mt-3 text-[color:var(--danger)]">
          {saveError}
        </p>
      ) : null}
    </section>
  );
};

const MORE = ["", "one", "two", "three", "four"];

// "I mostly watch Science Fiction, Drama and Thriller + one more."
const toGenreSentence = (genres: FavoriteGenre[]) => {
  if (genres.length === 0) return "On my profile: I haven't picked any genres yet.";
  const listed = genres.length === 1 ? genres[0] : `${genres.slice(0, -1).join(", ")} and ${genres[genres.length - 1]}`;
  const remaining = MAX_FAVORITE_GENRES - genres.length;
  return `On my profile: I mostly watch ${listed}${remaining > 0 ? ` + ${MORE[remaining]} more` : ""}.`;
};
