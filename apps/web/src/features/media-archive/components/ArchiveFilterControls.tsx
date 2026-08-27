import { Award, CalendarDays, Funnel, Globe2 } from "lucide-react";
import type { FocusEventHandler, RefObject } from "react";
import { ArchiveMenuRadioOption } from "@/features/media-archive/components/ArchiveMenuRadioOption";
import { ArchiveMenuTrigger } from "@/features/media-archive/components/ArchiveMenuTrigger";
import type { ArchiveCardModuleStyles, ArchiveMenuKey } from "@/features/media-archive/types";

type ArchiveFilterOption<TValue extends string> = {
  value: TValue;
  label: string;
};

type ArchiveFilterControlsProps<TSort extends string, TPeriod extends string = string> = {
  controlsRef: RefObject<HTMLDivElement | null>;
  openMenu: ArchiveMenuKey | null;
  onBlurCapture: FocusEventHandler<HTMLDivElement>;
  onToggleMenu: (menu: ArchiveMenuKey) => void;
  onCloseMenu: () => void;
  selectedGenre: string;
  selectedLanguage: string;
  selectedSort: TSort;
  selectedSortLabel: string;
  selectedLanguageLabel: string;
  archiveCountLabel: string;
  availableGenres?: ReadonlyArray<{ name: string; count?: number | null }>;
  sortOptions: ReadonlyArray<ArchiveFilterOption<TSort>>;
  languageOptions: ReadonlyArray<ArchiveFilterOption<string>>;
  onSelectGenre: (genre: string) => void;
  onSelectSort: (sort: TSort) => void;
  onSelectLanguage: (language: string) => void;
  moduleStyles: ArchiveCardModuleStyles;
  // Not every archive supports a trending-window filter (books/albums don't).
  // Omit all five together to render without the period trigger.
  selectedPeriod?: TPeriod;
  selectedPeriodLabel?: string;
  isPeriodDisabled?: boolean;
  periodOptions?: ReadonlyArray<ArchiveFilterOption<TPeriod>>;
  onSelectPeriod?: (period: TPeriod) => void;
};

export const ArchiveFilterControls = <TSort extends string, TPeriod extends string = string>({
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
  isPeriodDisabled = false,
  archiveCountLabel,
  availableGenres,
  sortOptions,
  periodOptions,
  languageOptions,
  onSelectGenre,
  onSelectSort,
  onSelectLanguage,
  onSelectPeriod,
  moduleStyles,
}: ArchiveFilterControlsProps<TSort, TPeriod>) => {
  const hasPeriodFilter = periodOptions !== undefined && onSelectPeriod !== undefined;
  return (
    <div
      ref={controlsRef}
      onBlurCapture={onBlurCapture}
      className="mb-8 border-b pb-4"
      style={{ borderColor: moduleStyles.border }}
    >
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <span
          className="font-mono text-[10px] uppercase tracking-[0.22em]"
          style={{ color: moduleStyles.faint }}
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
          moduleStyles={moduleStyles}
        >
          <div className="max-h-36 overflow-y-auto sm:max-h-48">
            <ArchiveMenuRadioOption
              isSelected={selectedGenre === "all"}
              onSelect={() => {
                onSelectGenre("all");
                onCloseMenu();
              }}
              moduleStyles={moduleStyles}
            >
              All Genres
            </ArchiveMenuRadioOption>

            {(availableGenres ?? []).map((genre) => (
              <ArchiveMenuRadioOption
                key={`genre-option-${genre.name}`}
                isSelected={selectedGenre === genre.name}
                onSelect={() => {
                  onSelectGenre(genre.name);
                  onCloseMenu();
                }}
                moduleStyles={moduleStyles}
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
          moduleStyles={moduleStyles}
        >
          {sortOptions.map((option) => (
            <ArchiveMenuRadioOption
              key={`sort-option-${option.value}`}
              isSelected={selectedSort === option.value}
              onSelect={() => {
                onSelectSort(option.value);
                onCloseMenu();
              }}
              moduleStyles={moduleStyles}
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
          moduleStyles={moduleStyles}
        >
          <div className="max-h-36 overflow-y-auto sm:max-h-48">
            {languageOptions.map((option) => (
              <ArchiveMenuRadioOption
                key={`language-option-${option.value}`}
                isSelected={selectedLanguage === option.value}
                onSelect={() => {
                  onSelectLanguage(option.value);
                  onCloseMenu();
                }}
                moduleStyles={moduleStyles}
              >
                {option.label}
              </ArchiveMenuRadioOption>
            ))}
          </div>
        </ArchiveMenuTrigger>

        {hasPeriodFilter ? (
          <ArchiveMenuTrigger
            menu="period"
            openMenu={openMenu}
            onToggleMenu={onToggleMenu}
            disabled={isPeriodDisabled}
            icon={<CalendarDays className="h-3 w-3" />}
            label={`Time: ${selectedPeriodLabel}`}
            menuClassName="min-w-40"
            moduleStyles={moduleStyles}
          >
            {periodOptions.map((option) => (
              <ArchiveMenuRadioOption
                key={`period-option-${option.value}`}
                isSelected={selectedPeriod === option.value}
                onSelect={() => {
                  onSelectPeriod(option.value);
                  onCloseMenu();
                }}
                moduleStyles={moduleStyles}
              >
                {option.label}
              </ArchiveMenuRadioOption>
            ))}
          </ArchiveMenuTrigger>
        ) : null}

        {hasPeriodFilter && isPeriodDisabled ? (
          <p
            className="font-mono text-[9px] uppercase tracking-[0.12em]"
            style={{ color: moduleStyles.faint }}
          >
            Weekly trending mode
          </p>
        ) : null}

        <p
          className="ml-auto shrink-0 font-mono text-[10px]"
          style={{ color: moduleStyles.faint }}
        >
          {archiveCountLabel}
        </p>
      </div>
    </div>
  );
};
