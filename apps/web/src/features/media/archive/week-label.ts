const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const DAY_MS = 86_400_000;

// "WK 45 · NOV 2–8": the ISO week holding `date`, Monday to Sunday.
export const toWeekLabel = (date: Date): string => {
  const dayFromMonday = (date.getDay() + 6) % 7;
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate() - dayFromMonday);
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
  const thursday = Date.UTC(monday.getFullYear(), monday.getMonth(), monday.getDate() + 3);
  const yearStart = Date.UTC(new Date(thursday).getUTCFullYear(), 0, 1);
  const week = Math.ceil(((thursday - yearStart) / DAY_MS + 1) / 7);

  const range =
    monday.getMonth() === sunday.getMonth()
      ? `${MONTHS[monday.getMonth()]} ${monday.getDate()}–${sunday.getDate()}`
      : `${MONTHS[monday.getMonth()]} ${monday.getDate()} – ${MONTHS[sunday.getMonth()]} ${sunday.getDate()}`;

  return `WK ${week} · ${range}`;
};
