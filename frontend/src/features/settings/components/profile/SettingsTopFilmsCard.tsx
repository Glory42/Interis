import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { getMovieByTmdbId } from "@/features/films/api";
import { getPosterUrl } from "@/features/films/components/utils";
import type { UserTopMovie } from "@/features/profile/api";
import {
  profileKeys,
  useUpdateMyProfile,
  useUserTop4Movies,
} from "@/features/profile/hooks/useProfile";
import { Top4MovieSearchDialog } from "@/features/settings/components/profile/Top4MovieSearchDialog";
import { isApiError } from "@/lib/api-client";
import type { TmdbSearchMovie } from "@/types/api";

type SettingsTopFilmsCardProps = {
  username: string;
};

type TopFilmSlot = {
  id: number;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  releaseYear: number | null;
};

const toFixedLengthSlots = (
  items: Array<TopFilmSlot | null>,
): Array<TopFilmSlot | null> => [
  items[0] ?? null,
  items[1] ?? null,
  items[2] ?? null,
  items[3] ?? null,
];

const isTopFilmSlot = (slot: TopFilmSlot | null): slot is TopFilmSlot =>
  slot !== null;

const toTopMovieList = (slots: Array<TopFilmSlot | null>): UserTopMovie[] =>
  slots.filter(isTopFilmSlot).map((slot) => ({ ...slot, director: null }));

export const SettingsTopFilmsCard = ({
  username,
}: SettingsTopFilmsCardProps) => {
  const queryClient = useQueryClient();
  const top4Query = useUserTop4Movies(username);
  const updateProfileMutation = useUpdateMyProfile();

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSelectingMovie, setIsSelectingMovie] = useState(false);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [selectionSuccess, setSelectionSuccess] = useState<string | null>(null);
  const [optimisticSlots, setOptimisticSlots] =
    useState<Array<TopFilmSlot | null> | null>(null);

  const savedSlots = useMemo(() => {
    const normalized = (top4Query.data ?? []).map((movie) => ({
      id: movie.id,
      tmdbId: movie.tmdbId,
      title: movie.title,
      posterPath: movie.posterPath,
      releaseYear: movie.releaseYear,
    }));

    return toFixedLengthSlots(normalized);
  }, [top4Query.data]);

  const visibleSlots = optimisticSlots ?? savedSlots;
  const isSavingTopFilms = updateProfileMutation.isPending;
  const isInteractionDisabled = isSavingTopFilms || isSelectingMovie;

  const openPickerForSlot = (slotIndex: number) => {
    if (isInteractionDisabled) {
      return;
    }

    setActiveSlotIndex(slotIndex);
    setSearchQuery("");
    setSelectionError(null);
    setIsPickerOpen(true);
  };

  const closePicker = () => {
    setIsPickerOpen(false);
    setSearchQuery("");
    setActiveSlotIndex(null);
  };

  const persistTopFilms = async (nextSlots: Array<TopFilmSlot | null>) => {
    setSelectionError(null);
    setSelectionSuccess(null);
    setOptimisticSlots(nextSlots);

    try {
      const top4MovieIds = nextSlots
        .filter(isTopFilmSlot)
        .map((slot) => slot.id);

      await updateProfileMutation.mutateAsync({
        top4MovieIds,
      });

      queryClient.setQueryData<UserTopMovie[]>(
        profileKeys.top4(username),
        toTopMovieList(nextSlots),
      );

      setOptimisticSlots(null);
      setSelectionSuccess("Top films saved.");
    } catch (error) {
      setOptimisticSlots(null);
      setSelectionError(
        isApiError(error)
          ? error.message
          : "Could not save top films right now.",
      );
    }
  };

  const handleClearSlot = (slotIndex: number) => {
    const currentSlots = optimisticSlots ?? savedSlots;
    if (!currentSlots[slotIndex]) {
      return;
    }

    const nextSlots = [...currentSlots];
    nextSlots[slotIndex] = null;
    void persistTopFilms(toFixedLengthSlots(nextSlots));
  };

  const handleSelectMovie = async (movie: TmdbSearchMovie) => {
    const slotIndex = activeSlotIndex;
    if (slotIndex === null) {
      return;
    }

    setSelectionError(null);
    setSelectionSuccess(null);
    setIsSelectingMovie(true);

    try {
      const resolvedMovie = await getMovieByTmdbId(movie.id);

      const currentSlots = optimisticSlots ?? savedSlots;
      if (currentSlots[slotIndex]?.id === resolvedMovie.id) {
        closePicker();
        return;
      }

      const nextSlots = [...currentSlots];
      nextSlots[slotIndex] = {
        id: resolvedMovie.id,
        tmdbId: resolvedMovie.tmdbId,
        title: resolvedMovie.title,
        posterPath: resolvedMovie.posterPath,
        releaseYear: resolvedMovie.releaseYear,
      };

      closePicker();
      await persistTopFilms(toFixedLengthSlots(nextSlots));
    } catch (error) {
      setSelectionError(
        isApiError(error)
          ? error.message
          : "Could not select this movie right now.",
      );
    } finally {
      setIsSelectingMovie(false);
    }
  };

  return (
    <Card className="xl:col-span-2">
      <CardHeader>
        <CardTitle>Top films</CardTitle>
        <CardDescription>
          Pick up to 4 films shown on your profile overview. Selecting or
          clearing a slot saves automatically.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {top4Query.isPending ? (
          <p className="text-sm text-muted-foreground">
            Loading current top films...
          </p>
        ) : null}

        {top4Query.isError ? (
          <p className=" border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Could not load saved top films.
          </p>
        ) : null}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {visibleSlots.map((slot, index) => (
            <div key={`top-film-slot-${index + 1}`} className="space-y-2">
              <button
                type="button"
                onClick={() => openPickerForSlot(index)}
                disabled={isInteractionDisabled}
                className="group relative block w-full overflow-hidden  border border-border/70 bg-background/30"
              >
                <div className="aspect-2/3">
                  {slot ? (
                    <img
                      src={getPosterUrl(slot.posterPath)}
                      alt={`${slot.title} poster`}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                  ) : (
                    <span className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
                      <Plus className="h-4 w-4" />
                      <span className="text-[10px] uppercase tracking-[0.14em]">
                        Pick film
                      </span>
                    </span>
                  )}
                </div>

                <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-background/85 to-transparent px-2 py-2 text-[10px] text-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  {slot ? "Replace movie" : "Select movie"}
                </span>
              </button>

              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-foreground">
                    {slot?.title ?? `Slot ${index + 1}`}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {slot?.releaseYear ?? "Empty"}
                  </p>
                </div>

                {slot ? (
                  <button
                    type="button"
                    onClick={() => handleClearSlot(index)}
                    disabled={isInteractionDisabled}
                    className="inline-flex h-5 w-5 items-center justify-center  text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground"
                    aria-label={`Clear slot ${index + 1}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        {selectionError ? (
          <p className=" border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {selectionError}
          </p>
        ) : null}

        {selectionSuccess ? (
          <p className=" border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">
            {selectionSuccess}
          </p>
        ) : null}

        {isSavingTopFilms ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner className="h-4 w-4" /> Saving top films...
          </p>
        ) : null}
      </CardContent>

      <Top4MovieSearchDialog
        isOpen={isPickerOpen}
        onClose={closePicker}
        query={searchQuery}
        onQueryChange={setSearchQuery}
        onSelectMovie={(movie) => {
          void handleSelectMovie(movie);
        }}
        isSelectingMovie={isSelectingMovie}
      />
    </Card>
  );
};
