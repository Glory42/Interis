import { useMemo, useState } from "react";
import { getMovieByTmdbId } from "@/features/movies/api";
import { useUpdateMyProfile, useUserTopPicks } from "@/features/profile/hooks/useProfile";
import { getSeriesByTmdbId, type TmdbSearchSeries } from "@/features/serials/api";
import type { TmdbSearchMovie } from "@/types/api";
import { isApiError } from "@/lib/api-client";
import {
  asTopPickSlot,
  buildTopPickPayload,
  resolveCategorySlots,
  toFixedLengthSlots,
  type PickerTarget,
  type TopPickCategoryKey,
  type TopPickSlot,
} from "./models";

export const useSettingsFavoritesController = (username: string) => {
  const updateProfileMutation = useUpdateMyProfile();
  const topPicksQuery = useUserTopPicks(username);

  const [draftMovieSlots, setDraftMovieSlots] = useState<
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
  const movieCategory = categories.find((category) => category.key === "movie");
  const serialCategory = categories.find((category) => category.key === "serial");

  const savedMovieSlots = useMemo(
    () => resolveCategorySlots(movieCategory, "movie"),
    [movieCategory],
  );
  const savedSerialSlots = useMemo(
    () => resolveCategorySlots(serialCategory, "tv"),
    [serialCategory],
  );

  const movieSlots = draftMovieSlots ?? savedMovieSlots;
  const serialSlots = draftSerialSlots ?? savedSerialSlots;
  const isDirty = draftMovieSlots !== null || draftSerialSlots !== null;

  const selectedMovieCount = useMemo(
    () => movieSlots.filter(asTopPickSlot).length,
    [movieSlots],
  );
  const selectedSerialCount = useMemo(
    () => serialSlots.filter(asTopPickSlot).length,
    [serialSlots],
  );

  const isBusy = updateProfileMutation.isPending || isSelectingMovie || isSelectingSeries;

  const closePicker = () => {
    setPickerTarget(null);
    setSearchQuery("");
  };

  const openPickerForSlot = (category: TopPickCategoryKey, slotIndex: number) => {
    if (isBusy) {
      return;
    }

    setPickerTarget({ category, slotIndex });
    setSearchQuery("");
  };

  const updateSlotDraft = (
    category: TopPickCategoryKey,
    slotIndex: number,
    value: TopPickSlot | null,
  ) => {
    if (category === "movie") {
      setDraftMovieSlots((currentDraft) => {
        const current = currentDraft ?? movieSlots;
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
    if (!pickerTarget || pickerTarget.category !== "movie") {
      return;
    }

    setIsSelectingMovie(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const resolvedMovie = await getMovieByTmdbId(movie.id);

      updateSlotDraft("movie", pickerTarget.slotIndex, {
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
        isApiError(error) ? error.message : "Could not select this favorite right now.",
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
          buildTopPickPayload(1, movieSlots),
          buildTopPickPayload(2, serialSlots),
        ],
      });

      setDraftMovieSlots(null);
      setDraftSerialSlots(null);
      setSaveSuccess("Favorites saved.");
    } catch (error) {
      setSaveError(
        isApiError(error) ? error.message : "Could not save favorites right now.",
      );
    }
  };

  return {
    topPicksQuery,
    updateProfileMutation,
    pickerTarget,
    searchQuery,
    movieSlots,
    serialSlots,
    selectedMovieCount,
    selectedSerialCount,
    isDirty,
    isSelectingMovie,
    isSelectingSeries,
    saveError,
    saveSuccess,
    isBusy,
    setSearchQuery,
    openPickerForSlot,
    closePicker,
    handleSelectMovie,
    handleSelectSeries,
    handleClearSlot,
    handleSaveFavorites,
  };
};
