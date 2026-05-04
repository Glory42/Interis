import { describe, expect, it } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { authKeys } from "@/features/auth/hooks/useAuth";
import {
  requireAdminUser,
  requireAuthenticatedUser,
  requireGuestUser,
} from "@/lib/router/auth-guards";

const createTestQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
};

const baseUser = {
  id: "user_1",
  name: "cinefan",
  email: "cinefan@example.com",
  image: null,
  username: "cinefan",
  bio: null,
  location: null,
  avatarUrl: null,
  favoriteGenres: ["Drama"],
  themeId: "rose-pine",
  isAdmin: false,
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("auth guards", () => {
  it("returns user for authenticated guard", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(authKeys.me, baseUser);

    const user = await requireAuthenticatedUser({
      queryClient,
      redirectPath: "/settings/profile",
    });

    expect(user.username).toBe("cinefan");
  });

  it("redirects guests from protected routes", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(authKeys.me, null);

    await expect(
      requireAuthenticatedUser({
        queryClient,
        redirectPath: "/settings/profile",
      }),
    ).rejects.toMatchObject({
      options: {
        to: "/login",
      },
    });
  });

  it("redirects authenticated users away from guest-only routes", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(authKeys.me, baseUser);

    await expect(requireGuestUser(queryClient)).rejects.toMatchObject({
      options: {
        to: "/cinema",
      },
    });
  });

  it("redirects non-admin users from admin routes", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(authKeys.me, baseUser);

    await expect(
      requireAdminUser({
        queryClient,
        redirectPath: "/admin",
      }),
    ).rejects.toMatchObject({
      options: {
        to: "/",
      },
    });
  });
});
