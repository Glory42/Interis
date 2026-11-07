export const formatMoneyLabel = (value: number | null): string | null => {
  if (value === null || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
};
