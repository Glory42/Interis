import type { QueryClient } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";
import { authQueryOptions } from "@/features/auth/hooks/useAuth";
import { getSafeRedirectPath } from "@/lib/router/redirect";

type AuthGuardInput = {
  queryClient: QueryClient;
  redirectPath?: string;
};

export const requireAuthenticatedUser = async ({
  queryClient,
  redirectPath,
}: AuthGuardInput) => {
  const user = await queryClient.ensureQueryData(authQueryOptions);
  if (!user) {
    throw redirect({
      to: "/login",
      search: {
        redirect: getSafeRedirectPath(redirectPath, "/"),
      },
    });
  }

  return user;
};

export const requireGuestUser = async (queryClient: QueryClient) => {
  const user = await queryClient.ensureQueryData(authQueryOptions);
  if (user) {
    throw redirect({ to: "/cinema" });
  }
};

export const requireAdminUser = async ({
  queryClient,
  redirectPath,
}: AuthGuardInput) => {
  const user = await requireAuthenticatedUser({ queryClient, redirectPath });
  if (!user.isAdmin) {
    throw redirect({ to: "/" });
  }

  return user;
};
