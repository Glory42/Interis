import type { OnboardingTitle } from "../types/onboarding.types";

// Round-robin across the sources so Films, Series, trending and staples mix
// on the first screen; a title in two sources shows once.
export function interleaveTitles(sources: OnboardingTitle[][], max: number): OnboardingTitle[] {
  const seen = new Set<string>();
  const titles: OnboardingTitle[] = [];
  const longest = Math.max(0, ...sources.map((source) => source.length));

  for (let index = 0; index < longest && titles.length < max; index += 1) {
    for (const source of sources) {
      const title = source[index];
      if (!title || titles.length >= max) continue;
      const key = `${title.mediaType}:${title.tmdbId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      titles.push(title);
    }
  }

  return titles;
}
