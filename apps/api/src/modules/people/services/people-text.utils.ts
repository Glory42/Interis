export const toNullableTrimmed = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const toIsoDateOrNull = (value: string | null | undefined): string | null => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  return value;
};

export const toYearOrNull = (isoDate: string | null): number | null => {
  if (!isoDate) {
    return null;
  }

  const parsed = Number.parseInt(isoDate.slice(0, 4), 10);
  return Number.isNaN(parsed) ? null : parsed;
};

export const toNonNegativeIntOrNull = (value: number | null | undefined): number | null => {
  if (value === null || value === undefined || !Number.isFinite(value) || value < 0) {
    return null;
  }

  return Math.floor(value);
};
