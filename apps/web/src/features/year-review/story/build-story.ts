import type { YearReview } from "../api";
import type {
  CoverSlide,
  DirectorSlide,
  EmptySlide,
  EndSlide,
  GenreSlide,
  PersonaSlide,
  RhythmSlide,
  SpotlightSlide,
  StoryRankedTitle,
  StorySlide,
  TasteSlide,
  TimeMachineSlide,
  VolumeSlide,
  WordsSlide,
} from "./story.types";

const LABELS = {
  cover: "Cover",
  volume: "The volume",
  topFilms: "The five",
  topSeries: "The series",
  titles: "The year in titles",
  spotlight: "The one",
  genre: "The type",
  director: "The director",
  timeMachine: "The time machine",
  rhythm: "The rhythm",
  taste: "The taste",
  words: "The words",
  persona: "The verdict",
  empty: "A quiet year",
  end: "End credits",
} as const;

const coverSlide = (review: YearReview): CoverSlide => ({
  kind: "cover",
  id: "cover",
  label: LABELS.cover,
  depth: review.depth,
  year: review.year,
  isPartialYear: review.isPartialYear,
  user: review.user,
});

const volumeSlide = (review: YearReview): VolumeSlide => ({
  kind: "volume",
  id: "volume",
  label: LABELS.volume,
  depth: review.depth,
  totals: review.totals,
  previousYear: review.previousYear,
  isPartialYear: review.isPartialYear,
});

const spotlightSlide = (review: YearReview): SpotlightSlide | null =>
  review.topFilm
    ? {
        kind: "spotlight",
        id: "spotlight",
        label: LABELS.spotlight,
        title: review.topFilm,
      }
    : null;

const genreSlide = (review: YearReview): GenreSlide => {
  const totalTitles = review.totals.films + review.totals.series;
  return {
    kind: "genre",
    id: "genre",
    label: LABELS.genre,
    totalTitles,
    genres: review.topGenres.map((genre) => ({
      ...genre,
      share: totalTitles > 0 ? genre.count / totalTitles : 0,
    })),
  };
};

const hasDirector = (review: YearReview) =>
  (review.topDirectors[0]?.count ?? 0) >= 2 && review.directorTitles.length > 0;

const directorSlide = (review: YearReview): DirectorSlide => ({
  kind: "director",
  id: "director",
  label: LABELS.director,
  director: review.topDirectors[0]!,
  titles: review.directorTitles,
});

const hasTimeMachine = (review: YearReview) =>
  review.viewingAge !== null && review.pre1980Share !== null;

const timeMachineSlide = (review: YearReview): TimeMachineSlide => ({
  kind: "time-machine",
  id: "time-machine",
  label: LABELS.timeMachine,
  viewingAge: review.viewingAge!,
  pre1980Share: review.pre1980Share!,
  decades: review.decades,
});

const hasRhythm = (review: YearReview) => review.logsPerDay.length > 0;

const rhythmSlide = (review: YearReview): RhythmSlide => ({
  kind: "rhythm",
  id: "rhythm",
  label: LABELS.rhythm,
  months: review.months,
  busiestMonth: review.busiestMonth,
  busiestDay: review.busiestDay,
  longestStreak: review.longestStreak,
});

const hasTaste = (review: YearReview) =>
  review.ratings.average !== null || review.mostRewatched !== null;

const tasteSlide = (review: YearReview): TasteSlide => ({
  kind: "taste",
  id: "taste",
  label: LABELS.taste,
  average: review.ratings.average,
  communityAverage: review.ratings.communityAverage,
  ratedLogs: review.ratings.ratedLogs,
  highRatings: review.highRatings,
  mostRewatched: review.mostRewatched,
});

const hasWords = (review: YearReview) =>
  review.reviews.count > 0 || review.listsCreated > 0 || review.newFollowers > 0;

const wordsSlide = (review: YearReview): WordsSlide => ({
  kind: "words",
  id: "words",
  label: LABELS.words,
  count: review.reviews.count,
  mostLiked: review.reviews.mostLiked,
  listsCreated: review.listsCreated,
  newFollowers: review.newFollowers,
});

const personaSlide = (review: YearReview): PersonaSlide | null =>
  review.persona
    ? {
        kind: "persona",
        id: "persona",
        label: LABELS.persona,
        persona: review.persona,
      }
    : null;

const emptySlide = (review: YearReview): EmptySlide => ({
  kind: "empty",
  id: "empty",
  label: LABELS.empty,
  year: review.year,
  isPartialYear: review.isPartialYear,
  user: review.user,
});

const endSlide = (review: YearReview): EndSlide => ({
  kind: "end",
  id: "end",
  label: LABELS.end,
  totals: review.totals,
  goal: review.goal,
  isPartialYear: review.isPartialYear,
});

const byRank = (a: StoryRankedTitle, b: StoryRankedTitle) =>
  (b.rating ?? -1) - (a.rating ?? -1) ||
  b.logCount - a.logCount ||
  b.watchedDate.localeCompare(a.watchedDate);

const mixedTitles = (review: YearReview) =>
  [...review.topFilms, ...review.topSeries].sort(byRank).slice(0, 4);

// A thin year gets one strong beat after its titles; the persona wins if the
// year was strong enough for one.
const thinHighlight = (review: YearReview): StorySlide | null => {
  const persona = personaSlide(review);
  if (persona) return persona;
  if (hasTimeMachine(review)) return timeMachineSlide(review);
  if (hasDirector(review)) return directorSlide(review);
  if (review.topGenres.length > 0) return genreSlide(review);
  if (hasRhythm(review)) return rhythmSlide(review);
  if (hasTaste(review)) return tasteSlide(review);
  if (hasWords(review)) return wordsSlide(review);
  return null;
};

// The story's deck, in order. Pure: no React, no data fetching, no formatting
// beyond the genre shares and the mixed-title rank.
export const buildStory = (review: YearReview): StorySlide[] => {
  if (review.depth === "empty") return [emptySlide(review)];

  const slides: StorySlide[] = [coverSlide(review), volumeSlide(review)];

  if (review.depth === "thin") {
    const titles = mixedTitles(review);
    if (titles.length > 0) {
      slides.push({
        kind: "ranked-titles",
        id: "titles",
        label: LABELS.titles,
        scope: "mixed",
        titles,
      });
    }
    const highlight = thinHighlight(review);
    if (highlight) slides.push(highlight);
    slides.push(endSlide(review));
    return slides;
  }

  if (review.topFilms.length > 0) {
    slides.push({
      kind: "ranked-titles",
      id: "top-films",
      label: LABELS.topFilms,
      scope: "films",
      titles: review.topFilms,
    });
  }
  const spotlight = spotlightSlide(review);
  if (spotlight) slides.push(spotlight);
  if (review.topSeries.length > 0) {
    slides.push({
      kind: "ranked-titles",
      id: "top-series",
      label: LABELS.topSeries,
      scope: "series",
      titles: review.topSeries,
    });
  }
  if (review.topGenres.length > 0) slides.push(genreSlide(review));
  if (hasDirector(review)) slides.push(directorSlide(review));
  if (hasTimeMachine(review)) slides.push(timeMachineSlide(review));
  if (hasRhythm(review)) slides.push(rhythmSlide(review));
  if (hasTaste(review)) slides.push(tasteSlide(review));
  if (hasWords(review)) slides.push(wordsSlide(review));
  const persona = personaSlide(review);
  if (persona) slides.push(persona);
  slides.push(endSlide(review));
  return slides;
};

export { LABELS as storySlideLabels };
