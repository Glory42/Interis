import type { TmdbSearchMovie } from "@/types/api";
import type { TmdbSearchSeries } from "@/features/serials/api";
import type { MbSearchResult } from "@/features/music/api";
import type { GoogleBooksVolume } from "@/features/books/api";
import { Top4MovieSearchDialog } from "@/features/settings/components/profile/Top4MovieSearchDialog";
import { Top4SeriesSearchDialog } from "@/features/settings/components/profile/Top4SeriesSearchDialog";
import { Top4AlbumSearchDialog } from "@/features/settings/components/profile/Top4AlbumSearchDialog";
import { Top4BookSearchDialog } from "@/features/settings/components/profile/Top4BookSearchDialog";
import type { PickerTarget } from "./models";

type FavoritesPickerDialogsProps = {
  pickerTarget: PickerTarget | null;
  searchQuery: string;
  isSelectingMovie: boolean;
  isSelectingSeries: boolean;
  isSelectingAlbum: boolean;
  isSelectingBook: boolean;
  onClose: () => void;
  onQueryChange: (value: string) => void;
  onSelectMovie: (movie: TmdbSearchMovie) => void;
  onSelectSeries: (series: TmdbSearchSeries) => void;
  onSelectAlbum: (result: MbSearchResult) => void;
  onSelectBook: (volume: GoogleBooksVolume) => void;
};

export const FavoritesPickerDialogs = ({
  pickerTarget,
  searchQuery,
  isSelectingMovie,
  isSelectingSeries,
  isSelectingAlbum,
  isSelectingBook,
  onClose,
  onQueryChange,
  onSelectMovie,
  onSelectSeries,
  onSelectAlbum,
  onSelectBook,
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

      <Top4AlbumSearchDialog
        isOpen={pickerTarget?.category === "music"}
        onClose={onClose}
        query={searchQuery}
        onQueryChange={onQueryChange}
        onSelectAlbum={onSelectAlbum}
        isSelectingAlbum={isSelectingAlbum}
      />

      <Top4BookSearchDialog
        isOpen={pickerTarget?.category === "books"}
        onClose={onClose}
        query={searchQuery}
        onQueryChange={onQueryChange}
        onSelectBook={onSelectBook}
        isSelectingBook={isSelectingBook}
      />
    </>
  );
};
