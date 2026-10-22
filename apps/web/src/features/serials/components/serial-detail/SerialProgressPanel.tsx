import { SERIAL_MODULE_STYLES } from "@/features/media/styles";
import type {
  SerialDetailViewerTracking,
  SerialWatchStatus,
  UpdateSerialInteractionInput,
} from "@/features/serials/api";

type UserSetStatus = NonNullable<UpdateSerialInteractionInput["watchStatus"]>;

const STATUS_LABELS: Record<SerialWatchStatus, string> = {
  watching: "Watching",
  paused: "Paused",
  dropped: "Dropped",
  completed: "Completed",
};

const STATUS_ACTIONS: Record<SerialWatchStatus, { label: string; status: UserSetStatus }[]> = {
  watching: [
    { label: "Pause", status: "paused" },
    { label: "Drop", status: "dropped" },
  ],
  paused: [
    { label: "Resume", status: "watching" },
    { label: "Drop", status: "dropped" },
  ],
  dropped: [{ label: "Resume", status: "watching" }],
  completed: [],
};

type SerialProgressPanelProps = {
  tracking: SerialDetailViewerTracking;
  numberOfEpisodes: number | null;
  watchStatus: SerialWatchStatus | null;
  isStatusSaving: boolean;
  onWatchStatusChange: (status: UserSetStatus) => void;
};

export const SerialProgressPanel = ({
  tracking,
  numberOfEpisodes,
  watchStatus,
  isStatusSaving,
  onWatchStatusChange,
}: SerialProgressPanelProps) => {
  const actions = watchStatus ? STATUS_ACTIONS[watchStatus] : [];

  return (
    <div
      className="rounded-xl border p-3 space-y-3"
      style={{
        borderColor: SERIAL_MODULE_STYLES.border,
        background: SERIAL_MODULE_STYLES.panelElevated,
      }}
    >
      <p
        className="font-mono text-[9px] uppercase tracking-[0.22em]"
        style={{ color: SERIAL_MODULE_STYLES.faint }}
      >
        Your Progress
      </p>

      <div className="space-y-1.5 font-mono text-[11px]" style={{ color: SERIAL_MODULE_STYLES.muted }}>
        {watchStatus ? (
          <div className="flex justify-between">
            <span>Status:</span>
            <span className="font-bold text-foreground">{STATUS_LABELS[watchStatus]}</span>
          </div>
        ) : null}

        <div className="flex justify-between">
          <span>Episodes:</span>
          <span className="font-bold text-foreground">
            {tracking.watchedEpisodesCount} / {numberOfEpisodes ?? "?"}
          </span>
        </div>

        {tracking.currentEpisode ? (
          <div className="flex justify-between">
            <span>Up Next:</span>
            <span className="font-bold text-foreground font-semibold" style={{ color: SERIAL_MODULE_STYLES.accent }}>
              S{tracking.currentEpisode.seasonNumber}E{tracking.currentEpisode.episodeNumber}
            </span>
          </div>
        ) : (
          <div className="text-[10px] text-green-500 font-semibold uppercase tracking-wider">
            ✓ Series Completed
          </div>
        )}
      </div>

      {actions.length > 0 ? (
        <div className="flex gap-2">
          {actions.map((action) => (
            <button
              key={action.status}
              type="button"
              disabled={isStatusSaving}
              onClick={() => onWatchStatusChange(action.status)}
              className="flex-1 rounded-full border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ borderColor: SERIAL_MODULE_STYLES.border, color: SERIAL_MODULE_STYLES.text }}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="border-t pt-2 mt-2 space-y-1 font-mono text-[10px]" style={{ borderColor: SERIAL_MODULE_STYLES.borderSoft, color: SERIAL_MODULE_STYLES.faint }}>
        <div className="flex justify-between">
          <span>Ratings (S/E):</span>
          <span>{tracking.ratingsCount}</span>
        </div>
        <div className="flex justify-between">
          <span>Likes (S/E):</span>
          <span>{tracking.likesCount}</span>
        </div>
        <div className="flex justify-between">
          <span>Reviews (S/E):</span>
          <span>{tracking.reviewsCount}</span>
        </div>
      </div>
    </div>
  );
};
