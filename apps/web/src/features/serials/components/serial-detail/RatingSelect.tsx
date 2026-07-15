import { SERIAL_MODULE_STYLES } from "@/features/serials/components/serial-detail/styles";

const RATING_OPTIONS = [
  0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10,
];

type RatingSelectProps = {
  value: number | null;
  onChange: (value: number | null) => void;
  size?: "season" | "episode";
};

export const RatingSelect = ({ value, onChange, size = "season" }: RatingSelectProps) => {
  const isEpisode = size === "episode";

  return (
    <select
      value={value ?? ""}
      onChange={(e) => {
        const val = e.target.value ? parseFloat(e.target.value) : null;
        onChange(val);
      }}
      className={`rounded border bg-background/30 px-1 font-mono text-muted-foreground outline-none focus:border-primary ${
        isEpisode ? "h-6 text-[8px]" : "h-7 text-[9px]"
      }`}
      style={{ borderColor: SERIAL_MODULE_STYLES.borderSoft }}
    >
      <option value="" className="bg-card">★ --</option>
      {RATING_OPTIONS.map((option) => (
        <option key={option} value={option} className="bg-card">
          ★ {option.toFixed(1)}
        </option>
      ))}
    </select>
  );
};
