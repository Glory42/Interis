import type { MeProfile } from "@/types/api";

export const viewer: MeProfile = {
  id: "user-viewer",
  name: "Viewer",
  email: "viewer@example.com",
  username: "viewer",
  bio: null,
  location: null,
  avatarUrl: null,
  favoriteGenres: [],
  isAdmin: false,
  hasSecurityQuestion: true,
};

export const listDetailJson = (overrides: Record<string, unknown> = {}) => ({
  id: "list-1",
  userId: "user-owner",
  ownerUsername: "owner",
  title: "Heist films",
  description: null,
  isRanked: false,
  isPublic: false,
  derivedType: "movie",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  itemCount: 1,
  likeCount: 0,
  likedByViewer: false,
  viewerRole: "owner",
  collaborators: [],
  items: [
    {
      id: "entry-1",
      position: 1,
      itemType: "movie",
      note: "Start here",
      addedBy: { userId: "user-viewer", username: "viewer" },
      tmdbId: 550,
      title: "Rififi",
      posterPath: null,
      releaseYear: 1955,
      ownerRating: null,
      credit: null,
    },
  ],
  ...overrides,
});
