import { CoverSlide } from "./cover-slide";
import { RankedTitlesSlide } from "./ranked-titles-slide";
import { SpotlightSlide } from "./spotlight-slide";
import { StoryPlaceholder } from "./story-placeholder";
import type { StoryActions, StorySlide } from "./story.types";
import { VolumeSlide } from "./volume-slide";
import "./story-slides.css";

type StorySlideRendererProps = {
  slide: StorySlide;
  actions: StoryActions;
  username: string;
};

// Cards land slice by slice; the placeholder keeps the player usable between them.
export const StorySlideRenderer = ({ slide, actions, username }: StorySlideRendererProps) => {
  switch (slide.kind) {
    case "cover":
      return <CoverSlide slide={slide} actions={actions} />;
    case "volume":
      return <VolumeSlide slide={slide} actions={actions} />;
    case "ranked-titles":
      return <RankedTitlesSlide slide={slide} />;
    case "spotlight":
      return <SpotlightSlide slide={slide} username={username} />;
    default:
      return <StoryPlaceholder slide={slide} actions={actions} />;
  }
};
