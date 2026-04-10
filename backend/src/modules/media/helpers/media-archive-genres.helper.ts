type GenreLike = {
  id: number | null;
  name: string;
};

type ItemWithGenres<TGenre extends GenreLike> = {
  genres: TGenre[];
};

export const buildAvailableGenresFromItems = <TGenre extends GenreLike>(
  items: ItemWithGenres<TGenre>[],
): Array<{ id: number | null; name: string; count: number | null }> => {
  const availableGenreMap = new Map<string, { id: number | null; name: string; count: number | null }>();

  for (const item of items) {
    const seenInItem = new Set<string>();

    for (const genre of item.genres) {
      const normalizedName = genre.name.trim();
      if (!normalizedName) {
        continue;
      }

      const genreKey = normalizedName.toLowerCase();
      if (seenInItem.has(genreKey)) {
        continue;
      }

      seenInItem.add(genreKey);

      const existingGenre = availableGenreMap.get(genreKey);
      if (existingGenre) {
        existingGenre.count = (existingGenre.count ?? 0) + 1;
        continue;
      }

      availableGenreMap.set(genreKey, {
        id: genre.id,
        name: normalizedName,
        count: 1,
      });
    }
  }

  return [...availableGenreMap.values()].sort((left, right) =>
    left.name.localeCompare(right.name),
  );
};
