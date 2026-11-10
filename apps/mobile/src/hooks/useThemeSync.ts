import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { updateMyTheme } from "@/api/auth";
import { isThemeId, useThemeContext, type ThemeId } from "@/theme";
import type { MeProfile } from "@/types/auth";
import { authKeys } from "./useAuth";

// The theme is stored per account on the server (same as web). Adopt the
// account's theme once when a user signs in, and push local changes back.
export const useThemeSync = (user: MeProfile | null) => {
  const queryClient = useQueryClient();
  const { themeId, setThemeId } = useThemeContext();
  const syncedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user || syncedUserIdRef.current === user.id) {
      return;
    }
    syncedUserIdRef.current = user.id;
    if (isThemeId(user.themeId) && user.themeId !== themeId) {
      setThemeId(user.themeId);
    }
  }, [user, themeId, setThemeId]);

  return useCallback(
    (nextThemeId: ThemeId) => {
      setThemeId(nextThemeId);
      if (!user) {
        return;
      }
      // Keep the cached profile in step so a later sync never reverts to
      // the old server value.
      queryClient.setQueryData<MeProfile | null>(authKeys.me, (current) =>
        current ? { ...current, themeId: nextThemeId } : current,
      );
      updateMyTheme(nextThemeId).catch(() => undefined);
    },
    [user, setThemeId, queryClient],
  );
};
