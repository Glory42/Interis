import type { YearReview } from "../api";

export type StoryPersona = NonNullable<YearReview["persona"]>;
export type StoryRankedTitle = YearReview["topFilms"][number];
export type StorySpotlightTitle = NonNullable<YearReview["topFilm"]>;
export type StoryUser = YearReview["user"];
export type StoryTotals = YearReview["totals"];
export type StoryPreviousYear = YearReview["previousYear"];
export type StoryGoal = YearReview["goal"];
export type StoryMostLiked = YearReview["reviews"]["mostLiked"];
export type StoryMostRewatched = YearReview["mostRewatched"];
export type StoryDirector = YearReview["topDirectors"][number];
export type StoryDecade = YearReview["decades"][number];
export type StoryMonth = YearReview["months"][number];
export type StoryBusiestMonth = YearReview["busiestMonth"];
export type StoryBusiestDay = YearReview["busiestDay"];
export type StoryStreak = YearReview["longestStreak"];
export type StoryGenre = YearReview["topGenres"][number];

export type StorySlideId =
  | "cover"
  | "volume"
  | "top-films"
  | "top-series"
  | "titles"
  | "spotlight"
  | "genre"
  | "director"
  | "time-machine"
  | "rhythm"
  | "taste"
  | "words"
  | "persona"
  | "empty"
  | "end";

type StorySlideBase = {
  id: StorySlideId;
  label: string;
};

export type CoverSlide = StorySlideBase & {
  kind: "cover";
  id: "cover";
  depth: YearReview["depth"];
  year: number;
  isPartialYear: boolean;
  user: StoryUser;
};

export type VolumeSlide = StorySlideBase & {
  kind: "volume";
  id: "volume";
  depth: YearReview["depth"];
  totals: StoryTotals;
  previousYear: StoryPreviousYear;
  isPartialYear: boolean;
};

export type RankedTitlesSlide = StorySlideBase & {
  kind: "ranked-titles";
  id: "top-films" | "top-series" | "titles";
  scope: "films" | "series" | "mixed";
  titles: StoryRankedTitle[];
};

export type SpotlightSlide = StorySlideBase & {
  kind: "spotlight";
  id: "spotlight";
  title: StorySpotlightTitle;
};

export type GenreSlide = StorySlideBase & {
  kind: "genre";
  id: "genre";
  genres: (StoryGenre & { share: number })[];
  totalTitles: number;
};

export type DirectorSlide = StorySlideBase & {
  kind: "director";
  id: "director";
  director: StoryDirector;
  titles: YearReview["directorTitles"];
};

export type TimeMachineSlide = StorySlideBase & {
  kind: "time-machine";
  id: "time-machine";
  viewingAge: number;
  pre1980Share: number;
  decades: StoryDecade[];
};

export type RhythmSlide = StorySlideBase & {
  kind: "rhythm";
  id: "rhythm";
  months: StoryMonth[];
  busiestMonth: StoryBusiestMonth;
  busiestDay: StoryBusiestDay;
  longestStreak: StoryStreak;
};

export type TasteSlide = StorySlideBase & {
  kind: "taste";
  id: "taste";
  average: number | null;
  communityAverage: number | null;
  ratedLogs: number;
  highRatings: number;
  mostRewatched: StoryMostRewatched;
};

export type WordsSlide = StorySlideBase & {
  kind: "words";
  id: "words";
  count: number;
  mostLiked: StoryMostLiked;
  listsCreated: number;
  newFollowers: number;
};

export type PersonaSlide = StorySlideBase & {
  kind: "persona";
  id: "persona";
  persona: StoryPersona;
};

export type EmptySlide = StorySlideBase & {
  kind: "empty";
  id: "empty";
  year: number;
  isPartialYear: boolean;
  user: StoryUser;
};

export type EndSlide = StorySlideBase & {
  kind: "end";
  id: "end";
  totals: StoryTotals;
  goal: StoryGoal;
  isPartialYear: boolean;
};

export type StorySlide =
  | CoverSlide
  | VolumeSlide
  | RankedTitlesSlide
  | SpotlightSlide
  | GenreSlide
  | DirectorSlide
  | TimeMachineSlide
  | RhythmSlide
  | TasteSlide
  | WordsSlide
  | PersonaSlide
  | EmptySlide
  | EndSlide;

export type StorySlideKind = StorySlide["kind"];

export type StoryActions = {
  begin: () => void;
  next: () => void;
  previous: () => void;
  togglePause: () => void;
  isPaused: boolean;
};
