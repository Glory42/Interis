type MediaFieldsInput = {
  tmdbId?: number | null;
  mbid?: string | null;
  volumeId?: string | null;
  title: string | null;
  posterPath?: string | null;
  coverArtUrl?: string | null;
  artistName?: string | null;
  authors?: string[] | null;
  releaseYear: number | null;
};

export const toMediaFields = (media: MediaFieldsInput) => ({
  tmdbId: media.tmdbId ?? null,
  mbid: media.mbid ?? null,
  volumeId: media.volumeId ?? null,
  title: media.title,
  posterPath: media.posterPath ?? null,
  coverArtUrl: media.coverArtUrl ?? null,
  artistName: media.artistName ?? null,
  authors: media.authors ?? null,
  releaseYear: media.releaseYear,
});

export const toNullableMediaFields = (media: MediaFieldsInput | null) => ({
  tmdbId: media?.tmdbId ?? null,
  mbid: media?.mbid ?? null,
  volumeId: media?.volumeId ?? null,
  title: media?.title ?? null,
  posterPath: media?.posterPath ?? null,
  coverArtUrl: media?.coverArtUrl ?? null,
  artistName: media?.artistName ?? null,
  authors: media?.authors ?? null,
  releaseYear: media?.releaseYear ?? null,
});
