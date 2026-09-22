import { Moon } from "lucide-react";

type RatingPanelStarfieldProps = {
  accentColor: string;
};

// Ambient decoration for the "Your Rating" panel - the rocket-launch slider
// only occupies the left portion of the panel, so this fills the empty
// right side with a moon (the rocket's destination) and a scattered
// starfield, matching the rating widget's space theme.
const STAR_POSITIONS = [
  { top: "12%", left: "58%", size: 3, opacity: 0.4 },
  { top: "20%", left: "82%", size: 2, opacity: 0.25 },
  { top: "42%", left: "70%", size: 2, opacity: 0.45 },
  { top: "58%", left: "90%", size: 3, opacity: 0.3 },
  { top: "74%", left: "66%", size: 2, opacity: 0.22 },
  { top: "8%", left: "92%", size: 2, opacity: 0.3 },
  { top: "88%", left: "82%", size: 2, opacity: 0.28 },
];

export const RatingPanelStarfield = ({ accentColor }: RatingPanelStarfieldProps) => (
  <div className="pointer-events-none absolute inset-0" aria-hidden="true">
    <Moon
      className="absolute top-8 right-4 h-12 w-12 opacity-[0.08]"
      style={{ color: accentColor }}
    />

    {STAR_POSITIONS.map((star, index) => (
      <span
        key={index}
        className="absolute rounded-full"
        style={{
          top: star.top,
          left: star.left,
          width: star.size,
          height: star.size,
          background: accentColor,
          opacity: star.opacity,
        }}
      />
    ))}
  </div>
);
