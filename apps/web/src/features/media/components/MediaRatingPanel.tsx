import { Link } from "@tanstack/react-router";
import { SpaceRatingInput } from "@/features/films/components/SpaceRating";

// The "Your Rating" block - identical across every media type's actions
// sidebar today (only the module color tokens differ), so it's the first
// piece pulled fully into the shared shell rather than left as a slot.
export type MediaRatingPanelProps = {
  isAuthenticated: boolean;
  value: number | null;
  onChange: (value: number | null) => void;
  disabled?: boolean;
  accentColor: string;
  mutedColor: string;
  borderColor: string;
  panelColor: string;
  faintColor: string;
};

export const MediaRatingPanel = ({
  isAuthenticated,
  value,
  onChange,
  disabled = false,
  mutedColor,
  borderColor,
  panelColor,
  faintColor,
}: MediaRatingPanelProps) => {
  return (
    <div
      className="rounded-xl border p-3"
      style={{ borderColor, background: panelColor }}
    >
      <p
        className="mb-2 font-mono text-[9px] uppercase tracking-[0.22em]"
        style={{ color: faintColor }}
      >
        Your Rating
      </p>
      {isAuthenticated ? (
        <SpaceRatingInput value={value} onChange={onChange} disabled={disabled} />
      ) : (
        <Link to="/login" className="font-mono text-[10px]" style={{ color: mutedColor }} viewTransition>
          Sign in to rate
        </Link>
      )}
    </div>
  );
};
