import type { StoryActions, StorySlide } from "./story.types";

type StoryPlaceholderProps = {
  slide: StorySlide;
  actions: StoryActions;
};

// Scaffold for #254; the real card components replace it in #255–#257.
export const StoryPlaceholder = ({ slide, actions }: StoryPlaceholderProps) => (
  <div className="recap-placeholder">
    <p className="recap-kicker">{slide.label}</p>
    <h2 className="recap-placeholder-title">
      {slide.kind === "cover" ? "A year in the dark" : slide.label}
    </h2>
    <p className="recap-placeholder-note">The card content lands in the next slices.</p>
    {slide.kind === "cover" || slide.kind === "end" ? (
      <button type="button" className="recap-primary" data-story-control onClick={actions.begin}>
        {slide.kind === "cover" ? "Begin" : "Replay"}
      </button>
    ) : null}
  </div>
);
