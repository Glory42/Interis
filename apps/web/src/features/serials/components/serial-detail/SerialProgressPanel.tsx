import { SERIAL_MODULE_STYLES } from "@/features/media/styles";
import { toReelCounterLabel } from "@/features/serials/components/serial-detail/utils";
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
  const reelCounter = toReelCounterLabel(tracking.watchedEpisodesCount, numberOfEpisodes, tracking.currentEpisode);

  return (
    <div className="space-y-3 rounded-[3px] border border-[color:var(--line)] p-3">
      <p className="kicker text-muted-foreground">Your progress</p>

      <div className="mono-meta space-y-1.5 text-muted-foreground">
        {watchStatus ? (
          <div className="flex justify-between">
            <span>Status:</span>
            <span className="font-bold text-foreground">{STATUS_LABELS[watchStatus]}</span>
          </div>
        ) : null}

        {reelCounter ? (
          <p className="uppercase" style={{ color: SERIAL_MODULE_STYLES.accent }}>
            {reelCounter}
          </p>
        ) : null}
      </div>

      {actions.length > 0 ? (
        <div className="flex gap-2">
          {actions.map((action) => (
            <button
              key={action.status}
              type="button"
              disabled={isStatusSaving}
              onClick={() => onWatchStatusChange(action.status)}
              className="mono-meta flex-1 rounded-[3px] border border-[color:var(--line)] px-2 py-1 uppercase text-foreground transition-opacity hover:opacity-80 disabled:opacity-50"
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}

    </div>
  );
};
