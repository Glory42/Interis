import type { FocusEventHandler, RefObject } from "react";
import { ArchiveMenuRadioOption } from "@/features/media/archive/ArchiveMenuRadioOption";
import { ArchiveMenuTrigger } from "@/features/media/archive/ArchiveMenuTrigger";
import type { ArchiveCardModuleStyles, ArchiveMenuKey } from "@/features/media/types";

type ArchiveFilterOption<TValue extends string> = {
  value: TValue;
  label: string;
};

type ArchiveFilterControlsProps<TSort extends string, TPeriod extends string> = {
  controlsRef: RefObject<HTMLDivElement | null>;
  openMenu: ArchiveMenuKey | null;
  onBlurCapture: FocusEventHandler<HTMLDivElement>;
  onToggleMenu: (menu: ArchiveMenuKey) => void;
  onCloseMenu: () => void;
  selectedGenre: string;
  selectedLanguage: string;
  selectedSort: TSort;
  selectedPeriod: TPeriod;
  isPeriodDisabled: boolean;
  availableGenres?: ReadonlyArray<{ name: string; count?: number | null }>;
  sortOptions: ReadonlyArray<ArchiveFilterOption<TSort>>;
  periodOptions: ReadonlyArray<ArchiveFilterOption<TPeriod>>;
  languageOptions: ReadonlyArray<ArchiveFilterOption<string>>;
  onSelectGenre: (genre: string) => void;
  onSelectSort: (sort: TSort) => void;
  onSelectLanguage: (language: string) => void;
  onSelectPeriod: (period: TPeriod) => void;
  moduleStyles: ArchiveCardModuleStyles;
};

export const ArchiveFilterControls = <TSort extends string, TPeriod extends string>({
  controlsRef,
  openMenu,
  onBlurCapture,
  onToggleMenu,
  onCloseMenu,
  selectedGenre,
  selectedLanguage,
  selectedSort,
  selectedPeriod,
  isPeriodDisabled,
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
  // Derived here so callers only ever hand over a raw selection, never
  // a pre-computed label that could drift from the option list.
  const sortLabel = (sortOptions.find((option) => option.value === selectedSort)?.label ?? "Trending").toLowerCase();
  const languageLabel =
    selectedLanguage === "all"
      ? "any language"
      : (languageOptions.find((option) => option.value === selectedLanguage)?.label ?? selectedLanguage);
  const periodLabel = (periodOptions.find((option) => option.value === selectedPeriod)?.label ?? "This year").toLowerCase();
  const trigger = { openMenu, onToggleMenu, moduleStyles, variant: "sentence" as const };

  // "Showing every genre, trending, in any language." Each underlined word opens its menu.
  return (
    <div ref={controlsRef} onBlurCapture={onBlurCapture} className="body mb-6 text-muted-foreground">
      {"Showing "}
      <ArchiveMenuTrigger {...trigger} menu="genre" label={selectedGenre === "all" ? "every genre" : selectedGenre} menuClassName="min-w-42.5">
        <div className="max-h-48 overflow-y-auto">
          <ArchiveMenuRadioOption
            isSelected={selectedGenre === "all"}
            onSelect={() => {
              onSelectGenre("all");
              onCloseMenu();
            }}
            moduleStyles={moduleStyles}
          >
            Every genre
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
              {typeof genre.count === "number" ? `${genre.name} (${genre.count})` : genre.name}
            </ArchiveMenuRadioOption>
          ))}
        </div>
      </ArchiveMenuTrigger>
      {", "}
      <ArchiveMenuTrigger {...trigger} menu="sort" label={sortLabel} menuClassName="min-w-45">
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
      {isPeriodDisabled ? null : (
        <>
          {", "}
          <ArchiveMenuTrigger {...trigger} menu="period" label={periodLabel} menuClassName="min-w-40">
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
        </>
      )}
      {", in "}
      <ArchiveMenuTrigger {...trigger} menu="language" label={languageLabel} menuClassName="min-w-45">
        <div className="max-h-48 overflow-y-auto">
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
      {"."}
    </div>
  );
};
