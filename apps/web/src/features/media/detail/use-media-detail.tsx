import { useState } from "react";
import { CircleCheck, CircleDot, CirclePlus, Heart } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useFilmInteraction, useUpdateFilmInteraction } from "@/features/interactions/hooks/useInteractions";
import type { MediaAction } from "@/features/media/detail/MediaActionsSidebar";
import type { MediaKind } from "@/features/media/media-cache";
import type { SeriesWatchStatus, UpdateSeriesInteractionInput } from "@/features/tv/api";
import { useSeriesInteraction, useUpdateSeriesInteraction } from "@/features/tv/hooks/useTv";

type UserSetWatchStatus = NonNullable<UpdateSeriesInteractionInput["watchStatus"]>;
type InteractionWrite = { liked?: boolean; watchlisted?: boolean; rating?: number | null; watched?: boolean };

// The detail view's read of the viewer's latest rated Diary Entry.
type DetailUserRating = { rating: number | null } | null | undefined;

export type MediaDetailState = {
  kind: MediaKind;
  isAuthenticated: boolean;
  viewerUsername: string | null;
  // Watched, liked and watchlist toggles, in that order.
  actions: MediaAction[];
  yourRating: number | null;
  setRating: (rating: number | null) => void;
  isSaving: boolean;
  // Covers the first Interaction load and any write in flight.
  isBusy: boolean;
  isLoading: boolean;
  watchStatus: SeriesWatchStatus | null;
  setWatchStatus: (watchStatus: UserSetWatchStatus) => void;
  unwatchConfirmation: { onConfirm: (clearLikeAndRating: boolean) => void; onClose: () => void } | null;
};

export const isValidTmdbId = (tmdbId: number) => Number.isInteger(tmdbId) && tmdbId > 0;

// The viewer's Interaction with one Film or Series, as its detail page shows and edits it.
export const useMediaDetail = (kind: MediaKind, tmdbId: number, userRating: DetailUserRating): MediaDetailState => {
  const { user } = useAuth();
  const enabled = Boolean(user) && isValidTmdbId(tmdbId);
  const filmQuery = useFilmInteraction(tmdbId, enabled && kind === "film");
  const seriesQuery = useSeriesInteraction(tmdbId, enabled && kind === "tv");
  const updateFilm = useUpdateFilmInteraction(tmdbId);
  const updateSeries = useUpdateSeriesInteraction(tmdbId);
  const [isConfirmingUnwatch, setIsConfirmingUnwatch] = useState(false);

  const query = kind === "film" ? filmQuery : seriesQuery;
  const mutation = kind === "film" ? updateFilm : updateSeries;
  const write = (input: InteractionWrite) => void mutation.mutateAsync(input);

  const liked = query.data?.liked ?? false;
  const watchlisted = query.data?.watchlisted ?? false;
  const watched = query.data?.watched ?? false;
  const interactionRating = query.data?.rating ?? null;
  const yourRating = interactionRating ?? userRating?.rating ?? null;

  // A liked or rated title asks first whether the like and rating go too,
  // so it isn't left "liked, rated, not watched" by accident (#93).
  const toggleWatched = () => {
    if (watched && (liked || interactionRating !== null)) {
      setIsConfirmingUnwatch(true);
      return;
    }
    write({ watched: !watched });
  };

  const actions: MediaAction[] = [
    {
      key: "watched",
      isActive: watched,
      activeIcon: <CircleDot />,
      inactiveIcon: <CircleDot />,
      activeLabel: "Watched",
      inactiveLabel: "Watch",
      onToggle: toggleWatched,
    },
    {
      key: "liked",
      isActive: liked,
      activeIcon: <Heart className="fill-current" />,
      inactiveIcon: <Heart />,
      activeLabel: "Liked",
      inactiveLabel: "Like",
      onToggle: () => write({ liked: !liked }),
    },
    {
      key: "watchlist",
      isActive: watchlisted,
      activeIcon: <CircleCheck />,
      inactiveIcon: <CirclePlus />,
      activeLabel: "Watchlisted",
      inactiveLabel: "Watchlist",
      onToggle: () => write({ watchlisted: !watchlisted }),
    },
  ];

  return {
    kind,
    isAuthenticated: Boolean(user),
    viewerUsername: user?.username ?? null,
    actions,
    yourRating,
    setRating: (rating) => {
      if (user && rating !== yourRating) write({ rating });
    },
    isSaving: mutation.isPending,
    isBusy: query.isPending || mutation.isPending,
    isLoading: Boolean(user) && query.isLoading,
    watchStatus: seriesQuery.data?.watchStatus ?? null,
    setWatchStatus: (watchStatus) => {
      if (kind === "tv") void updateSeries.mutateAsync({ watchStatus });
    },
    unwatchConfirmation: isConfirmingUnwatch
      ? {
          onConfirm: (clearLikeAndRating) => {
            setIsConfirmingUnwatch(false);
            write(clearLikeAndRating ? { watched: false, liked: false, rating: null } : { watched: false });
          },
          onClose: () => setIsConfirmingUnwatch(false),
        }
      : null,
  };
};
