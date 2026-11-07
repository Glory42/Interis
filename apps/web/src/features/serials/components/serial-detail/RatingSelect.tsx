import { LaunchTrack } from "@/components/film/rating/LaunchTrack";
import { SERIAL_MODULE_STYLES } from "@/features/media/styles";

type RatingSelectProps = {
  value: number | null;
  onChange: (value: number | null) => void;
  size?: "season" | "episode";
  // Full-width track for sheets; rows use the small one.
  fullWidth?: boolean;
};

// Season and episode rows rate with a small launch track (0.5–10, saves on release).
export const RatingSelect = ({ value, onChange, size = "season", fullWidth = false }: RatingSelectProps) => (
  <LaunchTrack
    size={fullWidth ? undefined : "sm"}
    className={fullWidth ? "max-w-none" : undefined}
    value={value}
    onCommit={onChange}
    accentColor={SERIAL_MODULE_STYLES.accent}
    ariaLabel={`${size === "episode" ? "Episode" : "Season"} rating out of 10`}
  />
);
