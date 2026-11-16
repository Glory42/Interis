import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPushConfig,
  getPushPreferences,
  removeDeviceSubscription,
  saveDeviceSubscription,
  updatePushPreferences,
  type PushPreferences,
} from "@/features/push/api";
import {
  readPushDeviceState,
  subscribeThisDevice,
  unsubscribeThisDevice,
  type PushDeviceState,
} from "@/features/push/push-device";

export const pushKeys = {
  config: ["push", "config"] as const,
  device: ["push", "device"] as const,
  preferences: ["push", "preferences"] as const,
};

export const usePushConfig = () =>
  useQuery({ queryKey: pushKeys.config, queryFn: getPushConfig, staleTime: Infinity });

// Browser state, not server state: read once, then kept current by the mutations below.
export const usePushDevice = (enabled: boolean) =>
  useQuery({ queryKey: pushKeys.device, queryFn: readPushDeviceState, enabled, staleTime: Infinity });

export const usePushPreferences = (enabled: boolean) =>
  useQuery({ queryKey: pushKeys.preferences, queryFn: getPushPreferences, enabled });

export const useEnablePush = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (publicKey: string): Promise<PushDeviceState> => {
      const subscription = await subscribeThisDevice(publicKey);
      await saveDeviceSubscription(subscription);
      return { kind: "on", endpoint: subscription.endpoint ?? "" };
    },
    onSuccess: (state) => queryClient.setQueryData(pushKeys.device, state),
    // A denied prompt flips the device to blocked.
    onError: () => queryClient.invalidateQueries({ queryKey: pushKeys.device }),
  });
};

export const useDisablePush = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<PushDeviceState> => {
      const endpoint = await unsubscribeThisDevice();
      // If this fails, the push service's 410 on the next send cleans the row up.
      if (endpoint) await removeDeviceSubscription(endpoint).catch(() => undefined);
      return { kind: "off" };
    },
    onSuccess: (state) => queryClient.setQueryData(pushKeys.device, state),
    onError: () => queryClient.invalidateQueries({ queryKey: pushKeys.device }),
  });
};

export const useUpdatePushPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePushPreferences,
    onMutate: async (changes) => {
      await queryClient.cancelQueries({ queryKey: pushKeys.preferences });
      const previous = queryClient.getQueryData<PushPreferences>(pushKeys.preferences);
      queryClient.setQueryData<PushPreferences>(pushKeys.preferences, (old) =>
        old ? { ...old, ...changes } : old,
      );
      return { previous };
    },
    onError: (_error, _changes, context) => {
      queryClient.setQueryData(pushKeys.preferences, context?.previous);
    },
    onSuccess: (saved) => queryClient.setQueryData(pushKeys.preferences, saved),
  });
};
