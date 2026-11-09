import type { PersonCreditItem } from "@/features/people/api";
import type { CreditOrder } from "./types";

export type CreditLine = { text: string; badges: string[] };
export type CreditDecade = { label: string; credits: PersonCreditItem[] };

const VOICE_MARK = /\s*\((?:voice|uncredited voice)\)\s*$/i;

// One line per title: its jobs merged, or the role "as …", plus Voice / episode / upcoming badges.
export const toCreditLine = (credit: PersonCreditItem, now: Date): CreditLine => {
  const badges: string[] = [];
  let text = credit.jobs.length > 0 ? credit.jobs.join(" · ") : (credit.department ?? "");

  if (credit.character) {
    if (VOICE_MARK.test(credit.character)) badges.push("Voice");
    const role = credit.character.replace(VOICE_MARK, "").trim();
    text = role ? `as ${role}` : text;
  }
  if (credit.mediaType === "tv" && credit.episodeCount) badges.push(`${credit.episodeCount} ep`);
  if (credit.releaseDate && new Date(credit.releaseDate) > now) badges.push("Upcoming");

  return { text, badges };
};

export const CREDIT_ORDER_OPTIONS = [
  { value: "recent", word: "newest first", label: "Newest first" },
  { value: "oldest", word: "oldest first", label: "Oldest first" },
  { value: "popular", word: "most popular first", label: "Most popular" },
] as const satisfies ReadonlyArray<{ value: CreditOrder; word: string; label: string }>;

// Decades follow the server's order; popularity has no timeline, so it's one flat group.
export const toCreditGroups = (credits: PersonCreditItem[], order: CreditOrder): CreditDecade[] =>
  order === "popular" ? [{ label: "Most popular", credits }] : toDecades(credits);

// Decade groups in the order credits arrive (newest or oldest first); undated titles go last.
export const toDecades = (credits: PersonCreditItem[]): CreditDecade[] => {
  const decades: CreditDecade[] = [];
  const undated: PersonCreditItem[] = [];
  for (const credit of credits) {
    if (credit.releaseYear === null) {
      undated.push(credit);
      continue;
    }
    const label = `${Math.floor(credit.releaseYear / 10) * 10}s`;
    const current = decades.find((decade) => decade.label === label);
    if (current) current.credits.push(credit);
    else decades.push({ label, credits: [credit] });
  }
  return undated.length > 0 ? [...decades, { label: "Undated", credits: undated }] : decades;
};
