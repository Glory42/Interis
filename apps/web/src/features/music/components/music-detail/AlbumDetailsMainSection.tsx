import type { MusicDetailResponse } from "@/features/music/api";
import { AlbumEditionsSection } from "@/features/music/components/music-detail/AlbumEditionsSection";
import { MUSIC_MODULE_STYLES } from "@/features/music/components/music-detail/styles";
import { MediaStatsRow } from "@/features/media/components/MediaStatsRow";

type AlbumDetailsMainSectionProps = {
  detail: MusicDetailResponse;
};

export const AlbumDetailsMainSection = ({ detail }: AlbumDetailsMainSectionProps) => {
  const album = detail.album;

  const communityRatingLabel =
    detail.userLog?.rating !== null && detail.userLog?.rating !== undefined
      ? detail.userLog.rating.toFixed(1)
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

      <MediaStatsRow
        primaryValue={communityRatingLabel}
        primaryCountLabel={`${detail.logsCount.toLocaleString()} logs`}
        secondaryLabel="Reviews"
        secondaryValue={String(detail.reviewCount)}
        accentColor={MUSIC_MODULE_STYLES.accent}
        mutedColor={MUSIC_MODULE_STYLES.muted}
        faintColor={MUSIC_MODULE_STYLES.faint}
        borderColor={MUSIC_MODULE_STYLES.borderSoft}
      />

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

      <div className="mb-8 flex flex-wrap gap-8">
        {album.firstReleaseDate ? (
          <div>
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

        {album.lastfmListeners ? (
          <div>
            <p
              className="mb-1 font-mono text-[9px] uppercase tracking-[0.22em]"
              style={{ color: MUSIC_MODULE_STYLES.faint }}
            >
              Last.fm Listeners
            </p>
            <p className="font-mono text-sm" style={{ color: MUSIC_MODULE_STYLES.muted }}>
              {album.lastfmListeners.toLocaleString()}
            </p>
          </div>
        ) : null}
      </div>

      <AlbumEditionsSection mbid={album.mbid} />
    </section>
  );
};
