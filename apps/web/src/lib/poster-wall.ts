export const buildPosterWall = (
  posterPaths: (string | null)[],
  size: number,
): (string | null)[] => {
  if (posterPaths.length === 0) return [];
  return Array.from({ length: size }, (_, i) => posterPaths[i % posterPaths.length]);
};
