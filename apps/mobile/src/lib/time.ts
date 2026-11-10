// Ported from the web app (apps/web/src/lib/time.ts) so dates read the same
// on both clients.

type RelativeTimeMaxUnit = "day" | "year";

export const formatRelativeTime = (
  value: string | Date,
  options: { maxUnit?: RelativeTimeMaxUnit } = {},
): string => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const maxUnit = options.maxUnit ?? "day";
  const deltaSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(deltaSeconds) < 60) {
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
  if (maxUnit === "day" || Math.abs(deltaDays) < 30) {
    return formatter.format(deltaDays, "day");
  }

  const deltaMonths = Math.round(deltaDays / 30);
  if (Math.abs(deltaMonths) < 12) {
    return formatter.format(deltaMonths, "month");
  }

  return formatter.format(Math.round(deltaMonths / 12), "year");
};

// "YYYY-MM-DD" values carry no timezone; parse them as local midnight so the
// calendar day shown matches what was stored (see the web's parseDateOnly).
export const parseDateOnly = (dateOnlyValue: string): Date =>
  new Date(`${dateOnlyValue}T00:00:00`);

export const toLocalDateInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const todayAsLocalDateInput = (): string => toLocalDateInput(new Date());

export const formatDateOnlyLabel = (
  dateOnlyValue: string,
  options: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" },
): string => {
  const date = parseDateOnly(dateOnlyValue);
  if (Number.isNaN(date.getTime())) {
    return dateOnlyValue;
  }

  return date.toLocaleDateString(undefined, options);
};
