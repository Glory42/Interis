import { useMutation, useQueryClient } from "@tanstack/react-query";
import { applyMediaEvent, refreshAfter, type MediaEvent } from "@/features/media/media-cache";

type MediaMutationOptions<TData, TVariables> = {
  errorToast: string;
  mutationFn: (variables: TVariables) => Promise<TData>;
  // What the write does, as the media cache patches and refreshes it.
  event: (variables: TVariables) => MediaEvent;
};

export const useMediaMutation = <TData, TVariables>({
  errorToast,
  mutationFn,
  event,
}: MediaMutationOptions<TData, TVariables>) => {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { errorToast },
    mutationFn,
    onMutate: async (variables: TVariables) => ({ rollback: await applyMediaEvent(queryClient, event(variables)) }),
    onError: (_error, _variables, context) => context?.rollback(),
    onSettled: (_data, _error, variables) => refreshAfter(queryClient, event(variables)),
  });
};
