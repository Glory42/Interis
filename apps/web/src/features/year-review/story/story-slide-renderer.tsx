import { CoverSlide } from "./cover-slide";
import { DirectorSlide } from "./director-slide";
import { GenreSlide } from "./genre-slide";
import { RankedTitlesSlide } from "./ranked-titles-slide";
import { RhythmSlide } from "./rhythm-slide";
import { SpotlightSlide } from "./spotlight-slide";
import { StoryPlaceholder } from "./story-placeholder";
import { TimeMachineSlide } from "./time-machine-slide";
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
    case "genre":
      return <GenreSlide slide={slide} />;
    case "director":
      return <DirectorSlide slide={slide} />;
    case "time-machine":
      return <TimeMachineSlide slide={slide} />;
    case "rhythm":
      return <RhythmSlide slide={slide} />;
    default:
      return <StoryPlaceholder slide={slide} actions={actions} />;
  }
};
