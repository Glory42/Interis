type RelativeTimeMaxUnit = "day" | "year";

type RelativeTimeOptions = {
  maxUnit?: RelativeTimeMaxUnit;
};

export const formatRelativeTime = (
  value: string,
  options: RelativeTimeOptions = {},
): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const maxUnit = options.maxUnit ?? "day";
  const deltaSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const absSeconds = Math.abs(deltaSeconds);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (absSeconds < 60) {
    return formatter.format(deltaSeconds, "second");
  }

  const deltaMinutes = Math.round(deltaSeconds / 60);
  if (Math.abs(deltaMinutes) < 60) {
    return formatter.format(deltaMinutes, "minute");
  }

  const deltaHours = Math.round(deltaMinutes / 60);
  if (Math.abs(deltaHours) < 24) {
    return formatter.format(deltaHours, "hour");
  }

  const deltaDays = Math.round(deltaHours / 24);
  if (maxUnit === "day") {
    return formatter.format(deltaDays, "day");
  }

  if (Math.abs(deltaDays) < 30) {
    return formatter.format(deltaDays, "day");
  }

  const deltaMonths = Math.round(deltaDays / 30);
  if (Math.abs(deltaMonths) < 12) {
    return formatter.format(deltaMonths, "month");
  }

  const deltaYears = Math.round(deltaMonths / 12);
  return formatter.format(deltaYears, "year");
};

export const formatDateLabel = (
  value: string,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  },
): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, options);
};

// Postgres/TMDB "date"-only values ("YYYY-MM-DD") carry no time or
// timezone component. `new Date(dateOnlyValue)` parses them as UTC
// midnight per the ES spec, which then renders as the PREVIOUS day for
// any viewer west of UTC (e.g. the Americas) once formatted in their
// local timezone. Appending a bare time component forces local-time
// parsing instead, so the calendar date shown always matches what was
// actually stored, regardless of the viewer's own timezone.
export const parseDateOnly = (dateOnlyValue: string): Date =>
  new Date(`${dateOnlyValue}T00:00:00`);

// The viewer's local calendar date as "YYYY-MM-DD", for use as a
// date-input default/max. `new Date().toISOString().slice(0, 10)` returns
// UTC's current date instead, which is wrong for any viewer not on UTC -
// e.g. for a UTC+3 viewer (Turkey) it stays on "yesterday" until 3am
// local time, silently capping the log-date picker's max a day early.
export const todayAsLocalDateInput = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatDateOnlyLabel = (
  dateOnlyValue: string,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  },
): string => {
  const date = parseDateOnly(dateOnlyValue);
  if (Number.isNaN(date.getTime())) {
    return dateOnlyValue;
  }

  return date.toLocaleDateString(undefined, options);
};
