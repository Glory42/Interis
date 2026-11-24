import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser, loginWithEmail, logoutCurrentUser, registerWithEmail } from "@/api/auth";
import type { LoginInput, RegisterInput } from "@/types/auth";

export const authKeys = {
  me: ["auth", "me"] as const,
};

export const authQueryOptions = queryOptions({
  queryKey: authKeys.me,
  queryFn: getCurrentUser,
  retry: false,
  staleTime: 60_000,
});

export const useAuth = () => {
  const queryClient = useQueryClient();
  const userQuery = useQuery(authQueryOptions);

  const loginMutation = useMutation({
    mutationFn: (input: LoginInput) => loginWithEmail(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: authKeys.me }),
  });

  const registerMutation = useMutation({
    mutationFn: (input: RegisterInput) => registerWithEmail(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: authKeys.me }),
  });

  const logoutMutation = useMutation({
    mutationFn: logoutCurrentUser,
    onSuccess: () => {
      // Everything cached so far was fetched as this viewer; drop it all so
      // the next account (or guest) never sees stale per-viewer flags.
      queryClient.clear();
      queryClient.setQueryData(authKeys.me, null);
    },
  });

  return {
    user: userQuery.data ?? null,
    isUserLoading: userQuery.isPending,
    isAuthenticated: Boolean(userQuery.data),
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoginPending: loginMutation.isPending,
    isRegisterPending: registerMutation.isPending,
    isLogoutPending: logoutMutation.isPending,
  };
};
