import { useMemo, useState } from "react";
import { getMovieByTmdbId } from "@/features/films/api";
import { useUpdateMyProfile, useUserTopPicks } from "@/features/profile/hooks/useProfile";
import { getSeriesByTmdbId, type TmdbSearchSeries } from "@/features/serials/api";
import { getAlbumByMbid } from "@/features/music/api";
import { getBookByVolumeId } from "@/features/books/api";
import type { MbSearchResult } from "@/features/music/api";
import type { GoogleBooksVolume } from "@/features/books/api";
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

  const [draftCinemaSlots, setDraftCinemaSlots] = useState<Array<TopPickSlot | null> | null>(null);
  const [draftSerialSlots, setDraftSerialSlots] = useState<Array<TopPickSlot | null> | null>(null);
  const [draftMusicSlots, setDraftMusicSlots] = useState<Array<TopPickSlot | null> | null>(null);
  const [draftBooksSlots, setDraftBooksSlots] = useState<Array<TopPickSlot | null> | null>(null);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSelectingMovie, setIsSelectingMovie] = useState(false);
  const [isSelectingSeries, setIsSelectingSeries] = useState(false);
  const [isSelectingAlbum, setIsSelectingAlbum] = useState(false);
  const [isSelectingBook, setIsSelectingBook] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const categories = topPicksQuery.data?.categories ?? [];
  const cinemaCategory = categories.find((category) => category.key === "cinema");
  const serialCategory = categories.find((category) => category.key === "serial");
  const musicCategory = categories.find((category) => category.key === "music");
  const booksCategory = categories.find((category) => category.key === "books");

  const savedCinemaSlots = useMemo(() => resolveCategorySlots(cinemaCategory, "movie"), [cinemaCategory]);
  const savedSerialSlots = useMemo(() => resolveCategorySlots(serialCategory, "tv"), [serialCategory]);
  const savedMusicSlots = useMemo(() => resolveCategorySlots(musicCategory, "album"), [musicCategory]);
  const savedBooksSlots = useMemo(() => resolveCategorySlots(booksCategory, "book"), [booksCategory]);

  const cinemaSlots = draftCinemaSlots ?? savedCinemaSlots;
  const serialSlots = draftSerialSlots ?? savedSerialSlots;
  const musicSlots = draftMusicSlots ?? savedMusicSlots;
  const booksSlots = draftBooksSlots ?? savedBooksSlots;

  const isDirty = draftCinemaSlots !== null || draftSerialSlots !== null || draftMusicSlots !== null || draftBooksSlots !== null;

  const selectedCinemaCount = useMemo(() => cinemaSlots.filter(asTopPickSlot).length, [cinemaSlots]);
  const selectedSerialCount = useMemo(() => serialSlots.filter(asTopPickSlot).length, [serialSlots]);
  const selectedMusicCount = useMemo(() => musicSlots.filter(asTopPickSlot).length, [musicSlots]);
  const selectedBooksCount = useMemo(() => booksSlots.filter(asTopPickSlot).length, [booksSlots]);

  const isBusy = updateProfileMutation.isPending || isSelectingMovie || isSelectingSeries || isSelectingAlbum || isSelectingBook;

  const closePicker = () => {
    setPickerTarget(null);
    setSearchQuery("");
  };

  const openPickerForSlot = (category: TopPickCategoryKey, slotIndex: number) => {
    if (isBusy) return;
    setPickerTarget({ category, slotIndex });
    setSearchQuery("");
  };

  const updateSlotDraft = (category: TopPickCategoryKey, slotIndex: number, value: TopPickSlot | null) => {
    if (category === "cinema") {
      setDraftCinemaSlots((currentDraft) => {
        const current = currentDraft ?? cinemaSlots;
        const next = [...current];
        next[slotIndex] = value;
        return toFixedLengthSlots(next);
      });
    } else if (category === "serial") {
      setDraftSerialSlots((currentDraft) => {
        const current = currentDraft ?? serialSlots;
        const next = [...current];
        next[slotIndex] = value;
        return toFixedLengthSlots(next);
      });
    } else if (category === "music") {
      setDraftMusicSlots((currentDraft) => {
        const current = currentDraft ?? musicSlots;
        const next = [...current];
        next[slotIndex] = value;
        return toFixedLengthSlots(next);
      });
    } else if (category === "books") {
      setDraftBooksSlots((currentDraft) => {
        const current = currentDraft ?? booksSlots;
        const next = [...current];
        next[slotIndex] = value;
        return toFixedLengthSlots(next);
      });
    }
  };

  const handleSelectMovie = async (movie: TmdbSearchMovie) => {
    if (!pickerTarget || pickerTarget.category !== "cinema") return;
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
      setSaveError(isApiError(error) ? error.message : "Could not select this favorite right now.");
    } finally {
      setIsSelectingMovie(false);
    }
  };

  const handleSelectSeries = async (series: TmdbSearchSeries) => {
    if (!pickerTarget || pickerTarget.category !== "serial") return;
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
      setSaveError(isApiError(error) ? error.message : "Could not select this serial favorite right now.");
    } finally {
      setIsSelectingSeries(false);
    }
  };

  const handleSelectAlbum = async (result: MbSearchResult) => {
    if (!pickerTarget || pickerTarget.category !== "music") return;
    setIsSelectingAlbum(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      const album = await getAlbumByMbid(result.id);
      updateSlotDraft("music", pickerTarget.slotIndex, {
        slot: pickerTarget.slotIndex + 1,
        mediaType: "album",
        mediaSource: "musicbrainz",
        mediaSourceId: album.mbid,
        mbid: album.mbid,
        title: album.title,
        posterPath: null,
        coverArtUrl: album.coverArtUrl,
        releaseYear: album.firstReleaseYear,
        artistName: album.artistName,
      });
      closePicker();
    } catch (error) {
      setSaveError(isApiError(error) ? error.message : "Could not select this album right now.");
    } finally {
      setIsSelectingAlbum(false);
    }
  };

  const handleSelectBook = async (volume: GoogleBooksVolume) => {
    if (!pickerTarget || pickerTarget.category !== "books") return;
    setIsSelectingBook(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      const book = await getBookByVolumeId(volume.id);
      updateSlotDraft("books", pickerTarget.slotIndex, {
        slot: pickerTarget.slotIndex + 1,
        mediaType: "book",
        mediaSource: "googlebooks",
        mediaSourceId: book.googleVolumeId,
        volumeId: book.googleVolumeId,
        title: book.title,
        posterPath: null,
        coverArtUrl: book.coverImageUrl,
        releaseYear: book.publishedYear ?? null,
        authors: book.authors ?? [],
      });
      closePicker();
    } catch (error) {
      setSaveError(isApiError(error) ? error.message : "Could not select this book right now.");
    } finally {
      setIsSelectingBook(false);
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
          buildTopPickPayload(3, musicSlots),
          buildTopPickPayload(4, booksSlots),
        ],
      });
      setDraftCinemaSlots(null);
      setDraftSerialSlots(null);
      setDraftMusicSlots(null);
      setDraftBooksSlots(null);
      setSaveSuccess("Favorites saved.");
    } catch (error) {
      setSaveError(isApiError(error) ? error.message : "Could not save favorites right now.");
    }
  };

  return {
    topPicksQuery,
    updateProfileMutation,
    pickerTarget,
    searchQuery,
    cinemaSlots,
    serialSlots,
    musicSlots,
    booksSlots,
    selectedCinemaCount,
    selectedSerialCount,
    selectedMusicCount,
    selectedBooksCount,
    isDirty,
    isSelectingMovie,
    isSelectingSeries,
    isSelectingAlbum,
    isSelectingBook,
    saveError,
    saveSuccess,
    isBusy,
    setSearchQuery,
    openPickerForSlot,
    closePicker,
    handleSelectMovie,
    handleSelectSeries,
    handleSelectAlbum,
    handleSelectBook,
    handleClearSlot,
    handleSaveFavorites,
  };
};
