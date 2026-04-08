import { useMemo, useState } from "react";
import { BookOpen, Film, Headphones, Tv, X } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { getMovieByTmdbId } from "@/features/films/api";
import {
  getSeriesByTmdbId,
  type TmdbSearchSeries,
} from "@/features/serials/api";
import {
  useUpdateMyProfile,
  useUserTopPicks,
} from "@/features/profile/hooks/useProfile";
import { Top4MovieSearchDialog } from "@/features/settings/components/profile/Top4MovieSearchDialog";
import { Top4SeriesSearchDialog } from "@/features/settings/components/profile/Top4SeriesSearchDialog";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { isApiError } from "@/lib/api-client";
import type { UserTopPickCategory } from "@/features/profile/api";
import type { TmdbSearchMovie } from "@/types/api";

type TopPickSlot = {
  slot: number;
  mediaType: "movie" | "tv";
  mediaSource: "tmdb";
  mediaSourceId: string;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  releaseYear: number | null;
};

type TopPickCategoryKey = "cinema" | "serial";

type PickerTarget = {
  category: TopPickCategoryKey;
  slotIndex: number;
};

const toFixedLengthSlots = (
  items: Array<TopPickSlot | null>,
): Array<TopPickSlot | null> => [
  items[0] ?? null,
  items[1] ?? null,
  items[2] ?? null,
  items[3] ?? null,
];

const asTopPickSlot = (slot: TopPickSlot | null): slot is TopPickSlot =>
  slot !== null;

const resolveCategorySlots = (
  category: UserTopPickCategory | undefined,
  mediaType: "movie" | "tv",
): Array<TopPickSlot | null> => {
  if (!category) {
    return [null, null, null, null];
  }

  const slots = [null, null, null, null] as Array<TopPickSlot | null>;

  for (const item of category.items) {
    if (item.mediaType !== mediaType) {
      continue;
    }

    const zeroIndexedSlot = item.slot - 1;
    if (zeroIndexedSlot < 0 || zeroIndexedSlot > 3) {
      continue;
    }

    const resolvedTmdbId =
      item.tmdbId ??
      (item.mediaSource === "tmdb" ? Number(item.mediaSourceId) : Number.NaN);

    if (!Number.isInteger(resolvedTmdbId) || !item.title) {
      continue;
    }

    slots[zeroIndexedSlot] = {
      slot: item.slot,
      mediaType,
      mediaSource: "tmdb",
      mediaSourceId: String(resolvedTmdbId),
      tmdbId: resolvedTmdbId,
      title: item.title,
      posterPath: item.posterPath,
      releaseYear: item.releaseYear,
    };
  }

  return toFixedLengthSlots(slots);
};

const buildTopPickPayload = (
  categoryId: 1 | 2,
  slots: Array<TopPickSlot | null>,
) => {
  return {
    categoryId,
    items: slots
      .map((slot, index) => {
        if (!slot) {
          return null;
        }

        return {
          slot: index + 1,
          mediaType: slot.mediaType,
          mediaSource: slot.mediaSource,
          mediaSourceId: slot.mediaSourceId,
          title: slot.title,
          posterPath: slot.posterPath,
          releaseYear: slot.releaseYear,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null),
  };
};

export const SettingsFavoritesSection = () => {
  const { user, isUserLoading } = useAuth();
  const updateProfileMutation = useUpdateMyProfile();

  const username = user?.username ?? "";
  const topPicksQuery = useUserTopPicks(username);

  const [draftCinemaSlots, setDraftCinemaSlots] = useState<
    Array<TopPickSlot | null> | null
  >(null);
  const [draftSerialSlots, setDraftSerialSlots] = useState<
    Array<TopPickSlot | null> | null
  >(null);

  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [isSelectingMovie, setIsSelectingMovie] = useState(false);
  const [isSelectingSeries, setIsSelectingSeries] = useState(false);

  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const categories = topPicksQuery.data?.categories ?? [];
  const cinemaCategory = categories.find((category) => category.key === "cinema");
  const serialCategory = categories.find((category) => category.key === "serial");

  const savedCinemaSlots = useMemo(
    () => resolveCategorySlots(cinemaCategory, "movie"),
    [cinemaCategory],
  );
  const savedSerialSlots = useMemo(
    () => resolveCategorySlots(serialCategory, "tv"),
    [serialCategory],
  );

  const cinemaSlots = draftCinemaSlots ?? savedCinemaSlots;
  const serialSlots = draftSerialSlots ?? savedSerialSlots;

  const isDirty = draftCinemaSlots !== null || draftSerialSlots !== null;

  const selectedCinemaCount = useMemo(
    () => cinemaSlots.filter(asTopPickSlot).length,
    [cinemaSlots],
  );
  const selectedSerialCount = useMemo(
    () => serialSlots.filter(asTopPickSlot).length,
    [serialSlots],
  );

  if (isUserLoading || !user) {
    return (
      <div className="border px-4 py-3 text-sm settings-shell-border settings-shell-muted settings-shell-panel">
        <p className="flex items-center gap-2">
          <Spinner /> Loading favorites settings...
        </p>
      </div>
    );
  }

  const openPickerForSlot = (category: TopPickCategoryKey, slotIndex: number) => {
    if (updateProfileMutation.isPending || isSelectingMovie || isSelectingSeries) {
      return;
    }

    setPickerTarget({ category, slotIndex });
    setSearchQuery("");
  };

  const closePicker = () => {
    setPickerTarget(null);
    setSearchQuery("");
  };

  const updateSlotDraft = (
    category: TopPickCategoryKey,
    slotIndex: number,
    value: TopPickSlot | null,
  ) => {
    if (category === "cinema") {
      setDraftCinemaSlots((currentDraft) => {
        const current = currentDraft ?? cinemaSlots;
        const next = [...current];
        next[slotIndex] = value;
        return toFixedLengthSlots(next);
      });
      return;
    }

    setDraftSerialSlots((currentDraft) => {
      const current = currentDraft ?? serialSlots;
      const next = [...current];
      next[slotIndex] = value;
      return toFixedLengthSlots(next);
    });
  };

  const handleSelectMovie = async (movie: TmdbSearchMovie) => {
    if (!pickerTarget || pickerTarget.category !== "cinema") {
      return;
    }

    setIsSelectingMovie(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const resolvedMovie = await getMovieByTmdbId(movie.id);

      updateSlotDraft("cinema", pickerTarget.slotIndex, {
        slot: pickerTarget.slotIndex + 1,
        mediaType: "movie",
        mediaSource: "tmdb",
        mediaSourceId: String(resolvedMovie.tmdbId),
        tmdbId: resolvedMovie.tmdbId,
        title: resolvedMovie.title,
        posterPath: resolvedMovie.posterPath,
        releaseYear: resolvedMovie.releaseYear,
      });

      closePicker();
    } catch (error) {
      setSaveError(
        isApiError(error)
          ? error.message
          : "Could not select this favorite right now.",
      );
    } finally {
      setIsSelectingMovie(false);
    }
  };

  const handleSelectSeries = async (series: TmdbSearchSeries) => {
    if (!pickerTarget || pickerTarget.category !== "serial") {
      return;
    }

    setIsSelectingSeries(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const resolvedSeries = await getSeriesByTmdbId(series.id);

      updateSlotDraft("serial", pickerTarget.slotIndex, {
        slot: pickerTarget.slotIndex + 1,
        mediaType: "tv",
        mediaSource: "tmdb",
        mediaSourceId: String(resolvedSeries.tmdbId),
        tmdbId: resolvedSeries.tmdbId,
        title: resolvedSeries.title,
        posterPath: resolvedSeries.posterPath,
        releaseYear: resolvedSeries.firstAirYear,
      });

      closePicker();
    } catch (error) {
      setSaveError(
        isApiError(error)
          ? error.message
          : "Could not select this serial favorite right now.",
      );
    } finally {
      setIsSelectingSeries(false);
    }
  };

  const handleClearSlot = (category: TopPickCategoryKey, slotIndex: number) => {
    updateSlotDraft(category, slotIndex, null);
    setSaveError(null);
    setSaveSuccess(null);
  };

  const handleSaveFavorites = async () => {
    setSaveError(null);
    setSaveSuccess(null);

    try {
      await updateProfileMutation.mutateAsync({
        topPicks: [
          buildTopPickPayload(1, cinemaSlots),
          buildTopPickPayload(2, serialSlots),
        ],
      });

      setDraftCinemaSlots(null);
      setDraftSerialSlots(null);
      setSaveSuccess("Favorites saved.");
    } catch (error) {
      setSaveError(
        isApiError(error)
          ? error.message
          : "Could not save favorites right now.",
      );
    }
  };

  const renderEditableRows = (category: TopPickCategoryKey, slots: Array<TopPickSlot | null>) => {
    return (
      <div className="space-y-2">
        {slots.map((slot, index) => (
          <div key={`${category}-slot-${index + 1}`} className="flex items-center gap-2">
            <span className="w-4 shrink-0 text-right font-mono text-[9px] settings-shell-muted">
              {index + 1}.
            </span>

            <button
              type="button"
              onClick={() => openPickerForSlot(category, index)}
              className="flex-1 border px-3 py-1.5 text-left font-mono text-xs focus:outline-none transition-colors settings-shell-border settings-shell-input hover:border-[color:var(--profile-shell-accent)]"
              disabled={
                updateProfileMutation.isPending || isSelectingMovie || isSelectingSeries
              }
            >
              <span className={slot ? "text-foreground" : "settings-shell-muted"}>
                {slot?.title ?? `${category === "cinema" ? "Cinema" : "Serial"} #${index + 1}`}
              </span>
            </button>

            <button
              type="button"
              className="shrink-0 p-1 settings-shell-muted transition-colors hover:text-foreground disabled:opacity-40"
              onClick={() => handleClearSlot(category, index)}
              disabled={!slot || updateProfileMutation.isPending}
              aria-label={`Clear ${category} slot ${index + 1}`}
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    );
  };

  const renderUnsupportedRows = (label: string) => {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={`${label}-slot-${index + 1}`} className="flex items-center gap-2">
            <span className="w-4 shrink-0 text-right font-mono text-[9px] settings-shell-muted">
              {index + 1}.
            </span>
            <input
              className="flex-1 border px-3 py-1.5 font-mono text-xs focus:outline-none settings-shell-border settings-shell-muted settings-shell-input disabled:cursor-not-allowed disabled:opacity-75"
              placeholder={`${label} #${index + 1}`}
              disabled
            />
            <button
              type="button"
              className="shrink-0 p-1 settings-shell-muted"
              disabled
              aria-label={`Clear ${label} slot ${index + 1}`}
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="border p-5 settings-shell-border settings-shell-panel">
        <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] settings-shell-accent">
          Top Picks
        </p>
        <p className="mb-5 font-mono text-[10px] settings-shell-muted">
          Set up to 4 favorites per category. These appear as a showcase on your public profile.
        </p>

        <div className="space-y-6">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Film className="h-3.5 w-3.5" style={{ color: "var(--module-cinema)" }} />
              <span
                className="font-mono text-[9px] uppercase tracking-[0.16em]"
                style={{ color: "var(--module-cinema)" }}
              >
                Cinema
              </span>
              <span className="font-mono text-[9px] settings-shell-muted">
                ({selectedCinemaCount}/4)
              </span>
            </div>

            {renderEditableRows("cinema", cinemaSlots)}
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <Tv className="h-3.5 w-3.5" style={{ color: "var(--module-serial)" }} />
              <span
                className="font-mono text-[9px] uppercase tracking-[0.16em]"
                style={{ color: "var(--module-serial)" }}
              >
                Serial
              </span>
              <span className="font-mono text-[9px] settings-shell-muted">
                ({selectedSerialCount}/4)
              </span>
            </div>

            {renderEditableRows("serial", serialSlots)}
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <BookOpen className="h-3.5 w-3.5" style={{ color: "var(--module-codex)" }} />
              <span
                className="font-mono text-[9px] uppercase tracking-[0.16em]"
                style={{ color: "var(--module-codex)" }}
              >
                Codex
              </span>
              <span className="font-mono text-[9px] settings-shell-muted">(0/4)</span>
            </div>

            {renderUnsupportedRows("Codex")}
            <p className="mt-2 font-mono text-[9px] settings-shell-muted">
              This category is not backed by profile favorites endpoints yet.
            </p>
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <Headphones className="h-3.5 w-3.5" style={{ color: "var(--module-echoes)" }} />
              <span
                className="font-mono text-[9px] uppercase tracking-[0.16em]"
                style={{ color: "var(--module-echoes)" }}
              >
                Echoes
              </span>
              <span className="font-mono text-[9px] settings-shell-muted">(0/4)</span>
            </div>

            {renderUnsupportedRows("Echoes")}
            <p className="mt-2 font-mono text-[9px] settings-shell-muted">
              This category is not backed by profile favorites endpoints yet.
            </p>
          </div>
        </div>

        {topPicksQuery.isPending ? (
          <p className="mt-4 flex items-center gap-2 font-mono text-xs settings-shell-muted">
            <Spinner className="h-3.5 w-3.5" /> Loading saved favorites...
          </p>
        ) : null}

        {topPicksQuery.isError ? (
          <p className="mt-4 border border-destructive/40 bg-destructive/10 px-3 py-2 font-mono text-xs text-destructive">
            Could not load saved favorites.
          </p>
        ) : null}

        {saveError ? (
          <p className="mt-4 border border-destructive/40 bg-destructive/10 px-3 py-2 font-mono text-xs text-destructive">
            {saveError}
          </p>
        ) : null}

        {saveSuccess ? (
          <p className="mt-4 border px-3 py-2 font-mono text-xs settings-shell-border settings-shell-accent settings-shell-active-pill">
            {saveSuccess}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => {
            void handleSaveFavorites();
          }}
          disabled={updateProfileMutation.isPending || !isDirty}
          className="mt-6 border px-5 py-2 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors settings-shell-border settings-shell-accent settings-shell-active-pill disabled:cursor-not-allowed disabled:opacity-60"
        >
          {updateProfileMutation.isPending ? "Saving..." : "Save Favorites"}
        </button>
      </div>

      <Top4MovieSearchDialog
        isOpen={pickerTarget?.category === "cinema"}
        onClose={closePicker}
        query={searchQuery}
        onQueryChange={setSearchQuery}
        onSelectMovie={(movie) => {
          void handleSelectMovie(movie);
        }}
        isSelectingMovie={isSelectingMovie}
      />

      <Top4SeriesSearchDialog
        isOpen={pickerTarget?.category === "serial"}
        onClose={closePicker}
        query={searchQuery}
        onQueryChange={setSearchQuery}
        onSelectSeries={(series) => {
          void handleSelectSeries(series);
        }}
        isSelectingSeries={isSelectingSeries}
      />
    </div>
  );
};
