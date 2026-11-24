import { useEffect, useState } from "react";
import { Animated, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { subscribeToToasts, type ToastMessage } from "@/lib/toast";
import { useTheme } from "@/theme";
import { AppText } from "./AppText";

const TOAST_DURATION_MS = 2800;

export const Toaster = () => {
  const { colors, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let hideTimeout: ReturnType<typeof setTimeout> | undefined;

    const unsubscribe = subscribeToToasts((next) => {
      setToast(next);
      clearTimeout(hideTimeout);
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      hideTimeout = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() =>
          setToast(null),
        );
      }, TOAST_DURATION_MS);
    });

    return () => {
      unsubscribe();
      clearTimeout(hideTimeout);
    };
  }, [opacity]);

  if (!toast) {
    return null;
  }

  const accent =
    toast.tone === "error" ? colors.destructive : toast.tone === "success" ? colors.primary : colors.border;

  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", left: 16, right: 16, bottom: insets.bottom + 72, alignItems: "center" }}
    >
      <Animated.View
        style={{
          opacity,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: radius,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.surfaceBorder,
          borderLeftWidth: 3,
          borderLeftColor: accent,
        }}
      >
        <AppText size={14}>{toast.message}</AppText>
      </Animated.View>
    </View>
  );
};
