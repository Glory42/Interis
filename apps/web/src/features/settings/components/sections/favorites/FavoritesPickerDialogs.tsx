import type { TmdbSearchFilm } from "@/types/api";
import type { TmdbSearchSeries } from "@/features/tv/api";
import { Top4FilmSearchDialog } from "@/features/settings/components/profile/Top4FilmSearchDialog";
import { Top4SeriesSearchDialog } from "@/features/settings/components/profile/Top4SeriesSearchDialog";
import type { PickerTarget } from "./models";

type FavoritesPickerDialogsProps = {
  pickerTarget: PickerTarget | null;
  searchQuery: string;
  isSelectingMovie: boolean;
  isSelectingSeries: boolean;
  onClose: () => void;
  onQueryChange: (value: string) => void;
  onSelectMovie: (movie: TmdbSearchFilm) => void;
  onSelectSeries: (series: TmdbSearchSeries) => void;
};

export const FavoritesPickerDialogs = ({
  pickerTarget,
  searchQuery,
  isSelectingMovie,
  isSelectingSeries,
  onClose,
  onQueryChange,
  onSelectMovie,
  onSelectSeries,
}: FavoritesPickerDialogsProps) => {
  return (
    <>
      <Top4FilmSearchDialog
        isOpen={pickerTarget?.category === "movie"}
        onClose={onClose}
        query={searchQuery}
        onQueryChange={onQueryChange}
        onSelectMovie={onSelectMovie}
        isSelectingMovie={isSelectingMovie}
      />

      <Top4SeriesSearchDialog
        isOpen={pickerTarget?.category === "serial"}
        onClose={onClose}
        query={searchQuery}
        onQueryChange={onQueryChange}
        onSelectSeries={onSelectSeries}
        isSelectingSeries={isSelectingSeries}
      />
    </>
  );
};
