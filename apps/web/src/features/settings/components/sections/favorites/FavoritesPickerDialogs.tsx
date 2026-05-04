import type { TmdbSearchMovie } from "@/types/api";
import type { TmdbSearchSeries } from "@/features/serials/api";
import { Top4MovieSearchDialog } from "@/features/settings/components/profile/Top4MovieSearchDialog";
import { Top4SeriesSearchDialog } from "@/features/settings/components/profile/Top4SeriesSearchDialog";
import type { PickerTarget } from "./models";

type FavoritesPickerDialogsProps = {
  pickerTarget: PickerTarget | null;
  searchQuery: string;
  isSelectingMovie: boolean;
  isSelectingSeries: boolean;
  onClose: () => void;
  onQueryChange: (value: string) => void;
  onSelectMovie: (movie: TmdbSearchMovie) => void;
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
      <Top4MovieSearchDialog
        isOpen={pickerTarget?.category === "cinema"}
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
