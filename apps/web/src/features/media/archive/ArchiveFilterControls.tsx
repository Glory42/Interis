import { SentenceSelect, type SentenceOption } from "@/components/ui/SentenceSelect";
import type { ArchiveCardModuleStyles } from "@/features/media/types";

type ArchiveFilterOption<TValue extends string> = {
  value: TValue;
  label: string;
};

type ArchiveFilterControlsProps<TSort extends string, TPeriod extends string> = {
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
  moduleStyles: Pick<ArchiveCardModuleStyles, "accent">;
};

// The word in the sentence is the lower-cased menu label ("Newest release" → "newest release").
const toSentenceOptions = <T extends string>(options: ReadonlyArray<ArchiveFilterOption<T>>): SentenceOption<T>[] =>
  options.map((option) => ({ ...option, word: option.label.toLowerCase() }));

// A genre or language from the URL still reads correctly before its list has loaded.
const withSelected = (selected: string, options: SentenceOption<string>[]): SentenceOption<string>[] =>
  options.some((option) => option.value === selected) ? options : [...options, { value: selected, word: selected, label: selected }];

export const ArchiveFilterControls = <TSort extends string, TPeriod extends string>({
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
  const accent = moduleStyles.accent;
  const genreOptions = withSelected(selectedGenre, [
    { value: "all", word: "every genre", label: "Every genre" },
    ...(availableGenres ?? []).map((genre) => ({
      value: genre.name,
      word: genre.name,
      label: genre.name,
      hint: typeof genre.count === "number" ? genre.count.toLocaleString("en-US") : undefined,
    })),
  ]);
  const languageSentenceOptions = withSelected(
    selectedLanguage,
    languageOptions.map((option) => ({ ...option, word: option.value === "all" ? "any language" : option.label })),
  );

  // "Showing every genre, trending, in any language." Each underlined word opens its menu.
  return (
    <div className="body mb-6 text-muted-foreground">
      {"Showing "}
      <SentenceSelect value={selectedGenre} options={genreOptions} onChange={onSelectGenre} accent={accent} />
      {", "}
      <SentenceSelect value={selectedSort} options={toSentenceOptions(sortOptions)} onChange={onSelectSort} accent={accent} />
      {isPeriodDisabled ? null : (
        <>
          {", "}
          <SentenceSelect
            value={selectedPeriod}
            options={toSentenceOptions(periodOptions)}
            onChange={onSelectPeriod}
            accent={accent}
          />
        </>
      )}
      {", in "}
      <SentenceSelect value={selectedLanguage} options={languageSentenceOptions} onChange={onSelectLanguage} accent={accent} />
      {"."}
    </div>
  );
};
