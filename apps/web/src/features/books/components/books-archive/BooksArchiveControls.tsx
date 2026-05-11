import { Award, Funnel, Globe2 } from "lucide-react";
import type { FocusEventHandler, RefObject } from "react";
import type { BooksArchiveResponse, BooksArchiveSort } from "@/features/books/api";
import { ArchiveMenuRadioOption } from "@/features/books/components/books-archive/ArchiveMenuRadioOption";
import { ArchiveMenuTrigger } from "@/features/books/components/books-archive/ArchiveMenuTrigger";
import {
  BOOK_MODULE_STYLES,
  languageOptions,
  sortOptions,
} from "@/features/books/components/books-archive/constants";
import type { OpenMenu } from "@/features/books/components/books-archive/types";

type BooksArchiveControlsProps = {
  controlsRef: RefObject<HTMLDivElement | null>;
  openMenu: OpenMenu;
  onBlurCapture: FocusEventHandler<HTMLDivElement>;
  onToggleMenu: (menu: Exclude<OpenMenu, null>) => void;
  onCloseMenu: () => void;
  selectedGenre: string;
  selectedLanguage: string;
  selectedSort: BooksArchiveSort;
  selectedSortLabel: string;
  selectedLanguageLabel: string;
  availableGenres?: BooksArchiveResponse["availableGenres"];
  archiveCountLabel: string;
  onSelectGenre: (genre: string) => void;
  onSelectSort: (sort: BooksArchiveSort) => void;
  onSelectLanguage: (language: string) => void;
};

export const BooksArchiveControls = ({
  controlsRef,
  openMenu,
  onBlurCapture,
  onToggleMenu,
  onCloseMenu,
  selectedGenre,
  selectedLanguage,
  selectedSort,
  selectedSortLabel,
  selectedLanguageLabel,
  availableGenres,
  archiveCountLabel,
  onSelectGenre,
  onSelectSort,
  onSelectLanguage,
}: BooksArchiveControlsProps) => {
  return (
    <div
      ref={controlsRef}
      onBlurCapture={onBlurCapture}
      className="mb-8 border-b pb-4"
      style={{ borderColor: BOOK_MODULE_STYLES.border }}
    >
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <span
          className="font-mono text-[10px] uppercase tracking-[0.22em]"
          style={{ color: BOOK_MODULE_STYLES.faint }}
        >
          Filter:
        </span>

        <ArchiveMenuTrigger
          menu="genre"
          openMenu={openMenu}
          onToggleMenu={onToggleMenu}
          icon={<Funnel className="h-3 w-3" />}
          label={selectedGenre === "all" ? "All Genres" : selectedGenre}
          menuClassName="min-w-42.5"
        >
          <div className="max-h-36 overflow-y-auto sm:max-h-48">
            <ArchiveMenuRadioOption
              isSelected={selectedGenre === "all"}
              onSelect={() => { onSelectGenre("all"); onCloseMenu(); }}
            >
              All Genres
            </ArchiveMenuRadioOption>
            {(availableGenres ?? []).map((genre) => (
              <ArchiveMenuRadioOption
                key={`book-genre-option-${genre.name}`}
                isSelected={selectedGenre === genre.name}
                onSelect={() => { onSelectGenre(genre.name); onCloseMenu(); }}
              >
                {typeof genre.count === "number" ? `${genre.name} (${genre.count})` : genre.name}
              </ArchiveMenuRadioOption>
            ))}
          </div>
        </ArchiveMenuTrigger>

        <ArchiveMenuTrigger
          menu="language"
          openMenu={openMenu}
          onToggleMenu={onToggleMenu}
          icon={<Globe2 className="h-3 w-3" />}
          label={`Language: ${selectedLanguageLabel}`}
          menuClassName="min-w-45"
        >
          <div className="max-h-36 overflow-y-auto sm:max-h-48">
            {languageOptions.map((option) => (
              <ArchiveMenuRadioOption
                key={`book-language-option-${option.value}`}
                isSelected={selectedLanguage === option.value}
                onSelect={() => { onSelectLanguage(option.value); onCloseMenu(); }}
              >
                {option.label}
              </ArchiveMenuRadioOption>
            ))}
          </div>
        </ArchiveMenuTrigger>

        <ArchiveMenuTrigger
          menu="sort"
          openMenu={openMenu}
          onToggleMenu={onToggleMenu}
          icon={<Award className="h-3 w-3" />}
          label={`Sort: ${selectedSortLabel}`}
          menuClassName="min-w-45"
        >
          {sortOptions.map((option) => (
            <ArchiveMenuRadioOption
              key={`book-sort-option-${option.value}`}
              isSelected={selectedSort === option.value}
              onSelect={() => { onSelectSort(option.value); onCloseMenu(); }}
            >
              {option.label}
            </ArchiveMenuRadioOption>
          ))}
        </ArchiveMenuTrigger>

        <p
          className="ml-auto shrink-0 font-mono text-[10px]"
          style={{ color: BOOK_MODULE_STYLES.faint }}
        >
          {archiveCountLabel}
        </p>
      </div>
    </div>
  );
};
