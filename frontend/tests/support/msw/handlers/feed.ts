import { http, HttpResponse } from "msw";

const feedItems = [
  {
    id: "activity_1",
    type: "review",
    kind: "review",
    createdAt: "2026-01-02T10:00:00.000Z",
    actor: {
      id: "user_1",
      username: "cinefan",
      displayUsername: "cinefan",
      image: null,
      avatarUrl: null,
    },
    movie: {
      tmdbId: 550,
      title: "Fight Club",
      posterPath: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
      releaseYear: 1999,
      mediaType: "movie",
    },
    post: null,
    review: {
      id: "review_1",
      content: "Still one of the sharpest rewatches.",
      containsSpoilers: false,
      rating: 9,
    },
    metadata: {
      action: "reviewed",
      excerpt: "Still one of the sharpest rewatches.",
      targetUsername: null,
      rating: 9,
      rewatch: false,
      hasReview: true,
      mediaType: "movie",
      containsSpoilers: false,
      reviewId: "review_1",
      commentId: null,
      movieId: 550,
      postId: null,
      postMediaId: null,
      postMediaType: null,
    },
    engagement: {
      likeCount: 4,
      commentCount: 1,
      viewerHasLiked: false,
    },
  },
];

export const feedHandlers = [
  http.get("*/api/social/feed/following", () => {
    return HttpResponse.json(feedItems);
  }),
];
