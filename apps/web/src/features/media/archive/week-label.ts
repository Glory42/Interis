export const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const DAY_MS = 86_400_000;

const mondayOf = (date: Date) => {
  const dayFromMonday = (date.getDay() + 6) % 7;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - dayFromMonday);
};

// ISO week number: the week belongs to the year its Thursday falls in.
export const toIsoWeek = (date: Date): number => {
  const monday = mondayOf(date);
  const thursday = Date.UTC(monday.getFullYear(), monday.getMonth(), monday.getDate() + 3);
  const yearStart = Date.UTC(new Date(thursday).getUTCFullYear(), 0, 1);
  return Math.ceil(((thursday - yearStart) / DAY_MS + 1) / 7);
};

// "WK 45 · NOV 2–8": the ISO week holding `date`, Monday to Sunday.
export const toWeekLabel = (date: Date): string => {
  const monday = mondayOf(date);
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
  const week = toIsoWeek(date);

  const range =
    monday.getMonth() === sunday.getMonth()
      ? `${MONTHS[monday.getMonth()]} ${monday.getDate()}–${sunday.getDate()}`
      : `${MONTHS[monday.getMonth()]} ${monday.getDate()} – ${MONTHS[sunday.getMonth()]} ${sunday.getDate()}`;

  return `WK ${week} · ${range}`;
};
