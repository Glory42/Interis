import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getCurrentUser,
  loginWithEmail,
  logoutCurrentUser,
  registerWithEmail,
  requestPasswordReset,
  resetPasswordWithSecurityAnswer,
  setCurrentUserSecurityQuestion,
  updateCurrentUserIdentity,
} from "@/features/auth/api";
import type { LoginInput, RegisterInput } from "@/types/api";
import { profileKeys } from "@/features/profile/hooks/useProfile";

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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authKeys.me });
    },
  });

  const registerMutation = useMutation({
    mutationFn: (input: RegisterInput) => registerWithEmail(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authKeys.me });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logoutCurrentUser,
    onSuccess: async () => {
      queryClient.setQueryData(authKeys.me, null);
      await queryClient.invalidateQueries({ queryKey: authKeys.me });
    },
  });

  const updateIdentityMutation = useMutation({
    mutationFn: ({ username }: { username: string }) =>
      updateCurrentUserIdentity({ username }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: authKeys.me }),
        queryClient.invalidateQueries({ queryKey: profileKeys.all }),
      ]);
    },
  });

  return {
    user: userQuery.data ?? null,
    isUserLoading: userQuery.isPending,
    userError: userQuery.error,
    isAuthenticated: Boolean(userQuery.data),
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    updateIdentity: updateIdentityMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoginPending: loginMutation.isPending,
    isRegisterPending: registerMutation.isPending,
    isUpdateIdentityPending: updateIdentityMutation.isPending,
    isLogoutPending: logoutMutation.isPending,
  };
};

export const useRequestPasswordReset = () => {
  return useMutation({
    mutationFn: (input: { email: string }) => requestPasswordReset(input),
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: (input: { email: string; answer: string; newPassword: string }) =>
      resetPasswordWithSecurityAnswer(input),
  });
};

export const useSetSecurityQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { question: string; answer: string }) =>
      setCurrentUserSecurityQuestion(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authKeys.me });
    },
  });
};
