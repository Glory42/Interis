export const deriveListType = (itemTypes: string[]): string | null => {
  if (itemTypes.length === 0) {
    return null;
  }

  const allMovie = itemTypes.every((t) => t === "movie");
  if (allMovie) {
    return "movie";
  }

  const allSerial = itemTypes.every((t) => t === "serial");
  if (allSerial) {
    return "serial";
  }

  return "mixed";
};
