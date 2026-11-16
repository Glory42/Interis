// One followed user's standing with a Film or Series, as its page lists them.
export type MediaFollowingRow = {
  username: string;
  displayUsername: string | null;
  avatarUrl: string | null;
  liked: boolean;
  watched: boolean;
  // Series only: watching, paused, dropped or completed.
  watchStatus: string | null;
  rating: number | null;
  watchedDate: string | null;
  reviewId: string | null;
};

export type MediaFollowingResponse = {
  summary: {
    count: number;
    ratedCount: number;
    reviewCount: number;
    averageRating: number | null;
  };
  people: MediaFollowingRow[];
  limit: number;
};
