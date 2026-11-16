const STORAGE_KEY = "interis:watch-region";
const FALLBACK_REGION = "US";
const REGION_PATTERN = /^[A-Z]{2}$/;

const toRegion = (value: string | null | undefined): string | null => {
  const upper = value?.toUpperCase() ?? "";
  return REGION_PATTERN.test(upper) ? upper : null;
};

// The browser's region subtag ("en-GB" → "GB"), else US.
export const browserWatchRegion = (language = typeof navigator === "undefined" ? "" : navigator.language): string => {
  try {
    return toRegion(new Intl.Locale(language).region) ?? FALLBACK_REGION;
  } catch {
    return FALLBACK_REGION;
  }
};

// Kept in localStorage only; storage errors just mean the browser default.
export const readWatchRegion = (): string => {
  try {
    return toRegion(window.localStorage.getItem(STORAGE_KEY)) ?? browserWatchRegion();
  } catch {
    return browserWatchRegion();
  }
};

export const storeWatchRegion = (region: string) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, region);
  } catch {
    // ignore
  }
};

let regionNames: Intl.DisplayNames | null | undefined;

// "GB" → "United Kingdom", falling back to the code where Intl can't name it.
export const regionLabel = (region: string): string => {
  if (regionNames === undefined) {
    try {
      regionNames = new Intl.DisplayNames(["en"], { type: "region" });
    } catch {
      regionNames = null;
    }
  }
  try {
    return regionNames?.of(region) ?? region;
  } catch {
    return region;
  }
};
