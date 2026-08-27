import type { TrackDetailResponse } from "@/features/music/track-api";
import { MUSIC_MODULE_STYLES } from "@/features/music/components/music-detail/styles";
import { MediaStatsRow } from "@/features/media/components/MediaStatsRow";

type TrackDetailsMainSectionProps = {
  detail: TrackDetailResponse;
};

const formatDurationLabel = (lengthMs: number | null): string | null => {
  if (lengthMs === null) return null;
  const totalSeconds = Math.round(lengthMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

export const TrackDetailsMainSection = ({ detail }: TrackDetailsMainSectionProps) => {
  const track = detail.track;

  const communityRatingLabel =
    detail.userLog?.rating !== null && detail.userLog?.rating !== undefined
      ? detail.userLog.rating.toFixed(1)
      : "--";

  const durationLabel = formatDurationLabel(track.length);

  return (
    <section>
      {track.disambiguation ? (
        <p className="mb-1 font-mono text-[10px]" style={{ color: MUSIC_MODULE_STYLES.faint }}>
          ({track.disambiguation})
        </p>
      ) : null}

      <h1
        className="mb-1 font-mono text-3xl font-bold leading-tight md:text-5xl"
        style={{ color: MUSIC_MODULE_STYLES.text }}
      >
        {track.title}
      </h1>

      <p className="mb-6 font-mono text-sm" style={{ color: MUSIC_MODULE_STYLES.muted }}>
        <span>by </span>
        <span style={{ color: MUSIC_MODULE_STYLES.accent }}>{track.artistName}</span>
        {durationLabel ? (
          <span style={{ color: MUSIC_MODULE_STYLES.faint }}> · {durationLabel}</span>
        ) : null}
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

      {track.previewUrl ? (
        <div
          className="mt-6 border p-3"
          style={{ borderColor: MUSIC_MODULE_STYLES.borderSoft, background: MUSIC_MODULE_STYLES.panelSoft }}
        >
          <p
            className="mb-2 font-mono text-[10px] uppercase tracking-wide"
            style={{ color: MUSIC_MODULE_STYLES.faint }}
          >
            30-second preview
          </p>
          <audio controls src={track.previewUrl} className="h-9 w-full max-w-sm" />
        </div>
      ) : null}
    </section>
  );
};
