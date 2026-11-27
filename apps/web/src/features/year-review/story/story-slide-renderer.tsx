import { CoverSlide } from "./cover-slide";
import { DirectorSlide } from "./director-slide";
import { EmptySlide } from "./empty-slide";
import { EndCreditsSlide } from "./end-credits-slide";
import { GenreSlide } from "./genre-slide";
import { PersonaSlide } from "./persona-slide";
import { RankedTitlesSlide } from "./ranked-titles-slide";
import { RhythmSlide } from "./rhythm-slide";
import { SpotlightSlide } from "./spotlight-slide";
import { TasteSlide } from "./taste-slide";
import { TimeMachineSlide } from "./time-machine-slide";
import type { StoryActions, StorySlide } from "./story.types";
import { VolumeSlide } from "./volume-slide";
import { WordsSlide } from "./words-slide";
import "./story-slides.css";

type StorySlideRendererProps = {
  slide: StorySlide;
  actions: StoryActions;
  username: string;
  year: number;
  isOwner: boolean;
  isLoggedIn: boolean;
};

// Cards land slice by slice; the placeholder keeps the player usable between them.
export const StorySlideRenderer = ({
  slide,
  actions,
  username,
  year,
  isOwner,
  isLoggedIn,
}: StorySlideRendererProps) => {
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
    case "taste":
      return <TasteSlide slide={slide} />;
    case "words":
      return <WordsSlide slide={slide} username={username} />;
    case "persona":
      return (
        <PersonaSlide slide={slide} username={username} year={year} onShare={actions.share} />
      );
    case "end":
      return (
        <EndCreditsSlide
          slide={slide}
          username={username}
          year={year}
          isOwner={isOwner}
          isLoggedIn={isLoggedIn}
          onShare={actions.share}
          onReplay={actions.replay}
        />
      );
    case "empty":
      return <EmptySlide slide={slide} isOwner={isOwner} />;
    default:
      return null;
  }
};
