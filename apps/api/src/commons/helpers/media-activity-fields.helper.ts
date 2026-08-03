type MediaFieldsInput = {
  tmdbId: number | null;
  title: string | null;
  posterPath: string | null;
  releaseYear: number | null;
};

export const toMediaFields = (media: MediaFieldsInput) => ({
  tmdbId: media.tmdbId,
  title: media.title,
  posterPath: media.posterPath,
  releaseYear: media.releaseYear,
});

export const toNullableMediaFields = (media: MediaFieldsInput | null) => ({
  tmdbId: media?.tmdbId ?? null,
  title: media?.title ?? null,
  posterPath: media?.posterPath ?? null,
  releaseYear: media?.releaseYear ?? null,
});
