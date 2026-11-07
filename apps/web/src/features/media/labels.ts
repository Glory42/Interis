// "English" from "en"; falls back to the upper-cased code where Intl can't name it.
export const toLanguageLabel = (languageCode: string | null): string | null => {
  if (!languageCode) return null;
  try {
    return new Intl.DisplayNames(["en"], { type: "language" }).of(languageCode) ?? languageCode.toUpperCase();
  } catch {
    return languageCode.toUpperCase();
  }
};

export const formatArchiveCount = (count: number): string =>
  count === 1 ? "1 title" : `${count.toLocaleString()} titles`;
