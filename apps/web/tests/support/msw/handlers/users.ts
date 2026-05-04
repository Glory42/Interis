import { http, HttpResponse } from "msw";

const currentUser = {
  id: "user_1",
  name: "cinefan",
  email: "cinefan@example.com",
  image: null,
  username: "cinefan",
  bio: "Logging every week.",
  location: "Istanbul",
  avatarUrl: null,
  favoriteGenres: ["Drama", "Science Fiction"],
  themeId: "rose-pine",
  isAdmin: false,
  createdAt: "2026-01-01T00:00:00.000Z",
};

const meSummary = {
  id: "user_1",
  username: "cinefan",
  displayUsername: "cinefan",
  image: null,
  avatarUrl: null,
  counts: {
    logs: 18,
    followers: 7,
    following: 12,
  },
  recentPosters: [
    {
      tmdbId: 550,
      title: "Fight Club",
      posterPath: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    },
  ],
};

export const usersHandlers = [
  http.get("*/api/users/me", async () => {
    return HttpResponse.json(currentUser);
  }),
  http.get("*/api/users/me/summary", async () => {
    return HttpResponse.json(meSummary);
  }),
  http.get("*/api/users/stats/network", async () => {
    return HttpResponse.json({
      totalUsers: 120,
      logsToday: 44,
      liveReviews: 19,
    });
  }),
  http.get("*/api/users", ({ request }) => {
    const query = new URL(request.url).searchParams.get("query")?.trim();
    if (!query) {
      return HttpResponse.json([]);
    }

    return HttpResponse.json([
      {
        id: "user_1",
        username: "cinefan",
        displayUsername: "cinefan",
        image: null,
        avatarUrl: null,
      },
    ]);
  }),
  http.get("*/api/users/:username", ({ params }) => {
    if (params.username !== currentUser.username) {
      return HttpResponse.json({ error: "User not found" }, { status: 404 });
    }

    return HttpResponse.json({
      ...currentUser,
      stats: {
        entryCount: 18,
        reviewCount: 6,
        filmCount: 15,
        listCount: 1,
        followerCount: 7,
        followingCount: 12,
      },
    });
  }),
  http.put("*/api/users/me", async ({ request }) => {
    const payload = (await request.json()) as Record<string, unknown>;

    return HttpResponse.json({
      userId: currentUser.id,
      bio: typeof payload.bio === "string" ? payload.bio : currentUser.bio,
      location:
        typeof payload.location === "string"
          ? payload.location
          : currentUser.location,
      avatarUrl:
        typeof payload.avatarUrl === "string"
          ? payload.avatarUrl
          : currentUser.avatarUrl,
      favoriteGenres: Array.isArray(payload.favoriteGenres)
        ? payload.favoriteGenres
        : currentUser.favoriteGenres,
      isAdmin: currentUser.isAdmin,
      createdAt: currentUser.createdAt,
      updatedAt: "2026-01-02T00:00:00.000Z",
    });
  }),
  http.put("*/api/users/me/theme", async ({ request }) => {
    const payload = (await request.json()) as { themeId?: string; theme?: string };
    return HttpResponse.json({
      themeId: payload.themeId ?? payload.theme ?? "rose-pine",
    });
  }),
];
