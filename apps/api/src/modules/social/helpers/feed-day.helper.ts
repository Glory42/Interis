// One formatter per canonical IANA zone, so the map stays bounded by real zones.
const dayFormatters = new Map<string, Intl.DateTimeFormat>();

const createDayFormatter = (timeZone: string): Intl.DateTimeFormat =>
  new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });

// The viewer's IANA time zone in canonical form; anything missing or invalid is UTC.
export const resolveTimeZone = (raw: unknown): string => {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 64) return "UTC";
  try {
    const formatter = createDayFormatter(raw);
    const canonical = formatter.resolvedOptions().timeZone;
    if (!dayFormatters.has(canonical)) dayFormatters.set(canonical, formatter);
    return canonical;
  } catch {
    return "UTC";
  }
};

const dayFormatterFor = (timeZone: string): Intl.DateTimeFormat => {
  let formatter = dayFormatters.get(timeZone);
  if (!formatter) {
    formatter = createDayFormatter(timeZone);
    dayFormatters.set(timeZone, formatter);
  }
  return formatter;
};

// "2026-11-02": the calendar day `date` falls on in `timeZone`.
export const toDayKey = (date: Date, timeZone: string): string => {
  const parts = dayFormatterFor(timeZone).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((entry) => entry.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
};
