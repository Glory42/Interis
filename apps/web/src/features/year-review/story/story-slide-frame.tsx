import type { ReactNode } from "react";
import type { StorySlide } from "./story.types";

type StorySlideFrameProps = {
  slide: StorySlide;
  children: ReactNode;
};

export const StorySlideFrame = ({ slide, children }: StorySlideFrameProps) => (
  <section
    className="recap-slide"
    role="group"
    aria-roledescription="slide"
    aria-label={slide.label}
    data-slide-id={slide.id}
  >
    {children}
  </section>
);
