export const deriveListType = (itemTypes: string[]): string | null => {
  if (itemTypes.length === 0) {
    return null;
  }

  const allCinema = itemTypes.every((t) => t === "cinema");
  if (allCinema) {
    return "cinema";
  }

  const allSerial = itemTypes.every((t) => t === "serial");
  if (allSerial) {
    return "serial";
  }

  return "mixed";
};
