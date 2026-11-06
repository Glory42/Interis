import { LaunchTrack } from "@/components/film/rating/LaunchTrack";
import { SERIAL_MODULE_STYLES } from "@/features/media/styles";

type RatingSelectProps = {
  value: number | null;
  onChange: (value: number | null) => void;
  size?: "season" | "episode";
};

// Season and episode rows rate with a small launch track (0.5–10, saves on release).
export const RatingSelect = ({ value, onChange, size = "season" }: RatingSelectProps) => (
  <LaunchTrack
    size="sm"
    value={value}
    onCommit={onChange}
    accentColor={SERIAL_MODULE_STYLES.accent}
    ariaLabel={`${size === "episode" ? "Episode" : "Season"} rating out of 10`}
  />
);
