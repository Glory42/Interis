export const getReleaseYear = (releaseDate: string): string | null => {
  if (releaseDate.length < 4) {
    return null;
  }

  return releaseDate.slice(0, 4);
};
