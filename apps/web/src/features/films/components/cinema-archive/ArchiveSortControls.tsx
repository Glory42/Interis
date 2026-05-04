import { Award, CalendarDays, Funnel, Globe2 } from "lucide-react";
import type { FocusEventHandler, RefObject } from "react";
import type {
  MovieArchivePeriod,
  MovieArchiveResponse,
  MovieArchiveSort,
} from "@/features/films/api";
import { ArchiveMenuRadioOption } from "@/features/films/components/cinema-archive/ArchiveMenuRadioOption";
import { ArchiveMenuTrigger } from "@/features/films/components/cinema-archive/ArchiveMenuTrigger";
import {
  CINEMA_MODULE_STYLES,
  languageOptions,
  periodOptions,
  sortOptions,
} from "@/features/films/components/cinema-archive/constants";
import type { OpenMenu } from "@/features/films/components/cinema-archive/types";

type ArchiveSortControlsProps = {
  controlsRef: RefObject<HTMLDivElement | null>;
  openMenu: OpenMenu;
  onBlurCapture: FocusEventHandler<HTMLDivElement>;
  onToggleMenu: (menu: Exclude<OpenMenu, null>) => void;
  onCloseMenu: () => void;
  selectedGenre: string;
  selectedLanguage: string;
  selectedSort: MovieArchiveSort;
  selectedPeriod: MovieArchivePeriod;
  selectedSortLabel: string;
  selectedLanguageLabel: string;
  selectedPeriodLabel: string;
  isPeriodDisabled: boolean;
  archiveCountLabel: string;
  availableGenres?: MovieArchiveResponse["availableGenres"];
  onSelectGenre: (genre: string) => void;
  onSelectSort: (sort: MovieArchiveSort) => void;
  onSelectLanguage: (language: string) => void;
  onSelectPeriod: (period: MovieArchivePeriod) => void;
};

export const ArchiveSortControls = ({
  controlsRef,
  openMenu,
  onBlurCapture,
  onToggleMenu,
  onCloseMenu,
  selectedGenre,
  selectedLanguage,
  selectedSort,
  selectedPeriod,
  selectedSortLabel,
  selectedLanguageLabel,
  selectedPeriodLabel,
  isPeriodDisabled,
  archiveCountLabel,
  availableGenres,
  onSelectGenre,
  onSelectSort,
  onSelectLanguage,
  onSelectPeriod,
}: ArchiveSortControlsProps) => {
  return (
    <div
      ref={controlsRef}
      onBlurCapture={onBlurCapture}
      className="mb-8 border-b pb-4"
      style={{ borderColor: CINEMA_MODULE_STYLES.border }}
    >
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <span
          className="font-mono text-[10px] uppercase tracking-[0.22em]"
          style={{ color: CINEMA_MODULE_STYLES.faint }}
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
              onSelect={() => {
                onSelectGenre("all");
                onCloseMenu();
              }}
            >
              All Genres
            </ArchiveMenuRadioOption>

            {(availableGenres ?? []).map((genre) => (
              <ArchiveMenuRadioOption
                key={`cinema-genre-option-${genre.name}`}
                isSelected={selectedGenre === genre.name}
                onSelect={() => {
                  onSelectGenre(genre.name);
                  onCloseMenu();
                }}
              >
                {typeof genre.count === "number"
                  ? `${genre.name} (${genre.count})`
                  : genre.name}
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
              key={`cinema-sort-option-${option.value}`}
              isSelected={selectedSort === option.value}
              onSelect={() => {
                onSelectSort(option.value);
                onCloseMenu();
              }}
            >
              {option.label}
            </ArchiveMenuRadioOption>
          ))}
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
                key={`cinema-language-option-${option.value}`}
                isSelected={selectedLanguage === option.value}
                onSelect={() => {
                  onSelectLanguage(option.value);
                  onCloseMenu();
                }}
              >
                {option.label}
              </ArchiveMenuRadioOption>
            ))}
          </div>
        </ArchiveMenuTrigger>

        <ArchiveMenuTrigger
          menu="period"
          openMenu={openMenu}
          onToggleMenu={onToggleMenu}
          disabled={isPeriodDisabled}
          icon={<CalendarDays className="h-3 w-3" />}
          label={`Time: ${selectedPeriodLabel}`}
          menuClassName="min-w-40"
        >
          {periodOptions.map((option) => (
            <ArchiveMenuRadioOption
              key={`cinema-period-option-${option.value}`}
              isSelected={selectedPeriod === option.value}
              onSelect={() => {
                onSelectPeriod(option.value);
                onCloseMenu();
              }}
            >
              {option.label}
            </ArchiveMenuRadioOption>
          ))}
        </ArchiveMenuTrigger>

        {isPeriodDisabled ? (
          <p
            className="font-mono text-[9px] uppercase tracking-[0.12em]"
            style={{ color: CINEMA_MODULE_STYLES.faint }}
          >
            Weekly trending mode
          </p>
        ) : null}

        <p
          className="ml-auto shrink-0 font-mono text-[10px]"
          style={{ color: CINEMA_MODULE_STYLES.faint }}
        >
          {archiveCountLabel}
        </p>
      </div>
    </div>
  );
};
