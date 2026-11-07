import type { PersonDetailResponse } from "@/features/people/api";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const parse = (value: string | null) => {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  return year && month && day ? new Date(year, month - 1, day) : null;
};

// "Jun 12 1964" from a date-only TMDB value; null when missing or malformed.
export const toLifeDate = (value: string | null): string | null => {
  const date = parse(value);
  return date ? `${MONTHS[date.getMonth()]} ${date.getDate()} ${date.getFullYear()}` : null;
};

// Age today, or at death; null without a birthday.
export const toAge = (birthday: string | null, deathday: string | null, now: Date): number | null => {
  const born = parse(birthday);
  if (!born) return null;
  const until = parse(deathday) ?? now;
  const hadBirthday =
    until.getMonth() > born.getMonth() || (until.getMonth() === born.getMonth() && until.getDate() >= born.getDate());
  return until.getFullYear() - born.getFullYear() - (hadBirthday ? 0 : 1);
};

// What to call each job in the stat line ("25 directed").
const STAT_VERBS: Record<string, string> = {
  Director: "directed",
  Screenplay: "screenplays",
  Writer: "written",
  Producer: "produced",
  "Director of Photography": "shot",
  Editor: "edited",
};

export type PersonStat = { value: number; label: string };

// TMDB lists "Thanks" as a crew job; it isn't work the person did, so it never leads.
export const toWorkedJobs = (detail: PersonDetailResponse) =>
  detail.credits.jobCounts.filter((row) => row.job !== "Thanks");

// The top jobs for a director; films and TV roles for an actor.
export const toPersonStats = (detail: PersonDetailResponse, role: "actor" | "director"): PersonStat[] => {
  if (role === "actor") {
    return [
      { value: detail.credits.counts.movies.cast, label: "films" },
      { value: detail.credits.counts.tv.cast, label: "TV" },
    ].filter((stat) => stat.value > 0);
  }
  return toWorkedJobs(detail)
    .slice(0, 3)
    .map((row) => ({ value: row.count, label: STAT_VERBS[row.job] ?? row.job.toLowerCase() }));
};
