import type { MusicDetailResponse } from "@/features/music/api";
import { MUSIC_MODULE_STYLES } from "@/features/music/components/music-detail/styles";

type AlbumDetailsMainSectionProps = {
  detail: MusicDetailResponse;
};

export const AlbumDetailsMainSection = ({ detail }: AlbumDetailsMainSectionProps) => {
  const album = detail.album;

  const communityRatingLabel =
    detail.userLog?.ratingOutOfFive !== null && detail.userLog?.ratingOutOfFive !== undefined
      ? detail.userLog.ratingOutOfFive.toFixed(1)
      : "--";

  const allGenres = [...(album.genres ?? [])].slice(0, 5);
  const allTypes = [album.primaryType, ...(album.secondaryTypes ?? [])]
    .filter(Boolean) as string[];

  return (
    <section>
      <div className="mb-1 flex flex-wrap items-center gap-2">
        {album.firstReleaseYear ? (
          <span className="font-mono text-[10px]" style={{ color: MUSIC_MODULE_STYLES.faint }}>
            {album.firstReleaseYear}
          </span>
        ) : null}
        {allTypes.map((type) => (
          <span
            key={`album-type-${type}`}
            className="border px-2 py-0.5 font-mono text-[9px]"
            style={{
              borderColor: MUSIC_MODULE_STYLES.border,
              color: MUSIC_MODULE_STYLES.muted,
            }}
          >
            {type}
          </span>
        ))}
      </div>

      <h1
        className="mb-1 font-mono text-3xl font-bold leading-tight md:text-5xl"
        style={{ color: MUSIC_MODULE_STYLES.text }}
      >
        {album.title}
      </h1>

      {album.disambiguation ? (
        <p className="mb-1 font-mono text-sm" style={{ color: MUSIC_MODULE_STYLES.faint }}>
          ({album.disambiguation})
        </p>
      ) : null}

      <p className="mb-6 font-mono text-sm" style={{ color: MUSIC_MODULE_STYLES.muted }}>
        <span>by </span>
        <span style={{ color: MUSIC_MODULE_STYLES.accent }}>{album.artistName}</span>
      </p>

      <div
        className="mb-8 flex flex-wrap items-center gap-8 border-b pb-8"
        style={{ borderColor: MUSIC_MODULE_STYLES.borderSoft }}
      >
        <div>
          <p
            className="mb-1 font-mono text-[9px] uppercase tracking-[0.22em]"
            style={{ color: MUSIC_MODULE_STYLES.faint }}
          >
            Community
          </p>
          <div className="flex items-baseline gap-2">
            <span
              className="font-mono text-2xl font-bold"
              style={{ color: MUSIC_MODULE_STYLES.accent }}
            >
              {communityRatingLabel}
            </span>
            <span
              className="font-mono text-[10px]"
              style={{ color: MUSIC_MODULE_STYLES.faint }}
            >
              {detail.logsCount.toLocaleString()} logs
            </span>
          </div>
        </div>

        <div>
          <p
            className="mb-1 font-mono text-[9px] uppercase tracking-[0.22em]"
            style={{ color: MUSIC_MODULE_STYLES.faint }}
          >
            Reviews
          </p>
          <span
            className="font-mono text-2xl font-bold"
            style={{ color: MUSIC_MODULE_STYLES.muted }}
          >
            {detail.reviewCount}
          </span>
        </div>
      </div>

      {allGenres.length > 0 ? (
        <div className="mb-8">
          <p
            className="mb-3 font-mono text-[9px] uppercase tracking-[0.22em]"
            style={{ color: MUSIC_MODULE_STYLES.faint }}
          >
            Genres
          </p>
          <div className="flex flex-wrap gap-2">
            {allGenres.map((genre) => (
              <span
                key={`album-genre-${genre.name}`}
                className="border px-2 py-1 font-mono text-[10px]"
                style={{
                  borderColor: MUSIC_MODULE_STYLES.border,
                  color: MUSIC_MODULE_STYLES.muted,
                  background: MUSIC_MODULE_STYLES.panelSoft,
                }}
              >
                {genre.name}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {album.firstReleaseDate ? (
        <div className="mb-8">
          <p
            className="mb-1 font-mono text-[9px] uppercase tracking-[0.22em]"
            style={{ color: MUSIC_MODULE_STYLES.faint }}
          >
            First released
          </p>
          <p className="font-mono text-sm" style={{ color: MUSIC_MODULE_STYLES.muted }}>
            {album.firstReleaseDate}
          </p>
        </div>
      ) : null}
    </section>
  );
};
