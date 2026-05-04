import type { PersonDetailResponse } from "@/features/people/api";

type PersonExternalLink = {
  label: string;
  href: string;
};

const toSafeExternalHref = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
};

const toExternalLink = (label: string, href: string | null): PersonExternalLink | null => {
  if (!href) {
    return null;
  }

  const safeHref = toSafeExternalHref(href);
  if (!safeHref) {
    return null;
  }

  return { label, href: safeHref };
};

export const buildPersonExternalLinks = (
  person: PersonDetailResponse["person"],
): PersonExternalLink[] => {
  return [
    toExternalLink(
      "IMDb",
      person.externalIds.imdbId
        ? `https://www.imdb.com/name/${person.externalIds.imdbId}`
        : null,
    ),
    toExternalLink(
      "Instagram",
      person.externalIds.instagramId
        ? `https://www.instagram.com/${person.externalIds.instagramId}`
        : null,
    ),
    toExternalLink(
      "X",
      person.externalIds.twitterId ? `https://x.com/${person.externalIds.twitterId}` : null,
    ),
    toExternalLink(
      "Facebook",
      person.externalIds.facebookId
        ? `https://www.facebook.com/${person.externalIds.facebookId}`
        : null,
    ),
    toExternalLink(
      "YouTube",
      person.externalIds.youtubeId
        ? `https://www.youtube.com/${person.externalIds.youtubeId}`
        : null,
    ),
    toExternalLink("Homepage", person.homepage),
  ].filter((link): link is PersonExternalLink => link !== null);
};

export type { PersonExternalLink };
