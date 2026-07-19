import type { QueryClient } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";
import { authQueryOptions } from "@/features/auth/hooks/useAuth";
import { getSafeRedirectPath } from "@/lib/router/redirect";

type AuthGuardInput = {
  queryClient: QueryClient;
  redirectPath?: string;
};

// `skipSecurityQuestionCheck` is for the setup-security-question route's own
// guard — it needs "is logged in" without redirecting into itself.
export const requireAuthenticatedUser = async ({
  queryClient,
  redirectPath,
  skipSecurityQuestionCheck = false,
}: AuthGuardInput & { skipSecurityQuestionCheck?: boolean }) => {
  const user = await queryClient.ensureQueryData(authQueryOptions);
  if (!user) {
    throw redirect({
      to: "/login",
      search: {
        redirect: getSafeRedirectPath(redirectPath, "/"),
      },
    });
  }

  if (!skipSecurityQuestionCheck && !user.hasSecurityQuestion) {
    throw redirect({ to: "/setup-security-question" });
  }

  return user;
};

export const requireGuestUser = async (queryClient: QueryClient) => {
  let user = queryClient.getQueryData(authQueryOptions.queryKey);

  if (user === undefined) {
    try {
      user = await queryClient.fetchQuery({ ...authQueryOptions, retry: false });
    } catch {
      user = null;
    }
  }

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
