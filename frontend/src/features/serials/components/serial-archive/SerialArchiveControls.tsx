import { Award, CalendarDays, Funnel, Globe2 } from "lucide-react";
import type { FocusEventHandler, RefObject } from "react";
import type {
  SerialArchivePeriod,
  SerialArchiveResponse,
  SerialArchiveSort,
} from "@/features/serials/api";
import { ArchiveMenuRadioOption } from "@/features/serials/components/serial-archive/ArchiveMenuRadioOption";
import { ArchiveMenuTrigger } from "@/features/serials/components/serial-archive/ArchiveMenuTrigger";
import {
  languageOptions,
  periodOptions,
  SERIAL_MODULE_STYLES,
  sortOptions,
} from "@/features/serials/components/serial-archive/constants";
import type {
  OpenMenu,
} from "@/features/serials/components/serial-archive/types";

type SerialArchiveControlsProps = {
  controlsRef: RefObject<HTMLDivElement | null>;
  openMenu: OpenMenu;
  onBlurCapture: FocusEventHandler<HTMLDivElement>;
  onToggleMenu: (menu: Exclude<OpenMenu, null>) => void;
  onCloseMenu: () => void;
  selectedGenre: string;
  selectedLanguage: string;
  selectedSort: SerialArchiveSort;
  selectedPeriod: SerialArchivePeriod;
  selectedSortLabel: string;
  selectedLanguageLabel: string;
  selectedPeriodLabel: string;
  availableGenres?: SerialArchiveResponse["availableGenres"];
  archiveCountLabel: string;
  onSelectGenre: (genre: string) => void;
  onSelectSort: (sort: SerialArchiveSort) => void;
  onSelectLanguage: (language: string) => void;
  onSelectPeriod: (period: SerialArchivePeriod) => void;
};

export const SerialArchiveControls = ({
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
  availableGenres,
  archiveCountLabel,
  onSelectGenre,
  onSelectSort,
  onSelectLanguage,
  onSelectPeriod,
}: SerialArchiveControlsProps) => {
  return (
    <div
      ref={controlsRef}
      onBlurCapture={onBlurCapture}
      className="mb-8 border-b pb-4"
      style={{ borderColor: SERIAL_MODULE_STYLES.border }}
    >
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <span
          className="font-mono text-[10px] uppercase tracking-[0.22em]"
          style={{ color: SERIAL_MODULE_STYLES.faint }}
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
                key={`serial-genre-option-${genre.name}`}
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
              key={`serial-sort-option-${option.value}`}
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
                key={`serial-language-option-${option.value}`}
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
          icon={<CalendarDays className="h-3 w-3" />}
          label={`Time: ${selectedPeriodLabel}`}
          menuClassName="min-w-40"
        >
          {periodOptions.map((option) => (
            <ArchiveMenuRadioOption
              key={`serial-period-option-${option.value}`}
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

        <p
          className="mt-3 font-mono text-[10px]"
          style={{ color: SERIAL_MODULE_STYLES.faint }}
        >
          {archiveCountLabel}
        </p>

      </div>
    </div>
  );
};
