import { useMemo, useState } from "react";
import { getMovieByTmdbId } from "@/features/films/api";
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
          buildTopPickPayload(1, cinemaSlots),
          buildTopPickPayload(2, serialSlots),
        ],
      });

      setDraftCinemaSlots(null);
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
    cinemaSlots,
    serialSlots,
    selectedCinemaCount,
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
