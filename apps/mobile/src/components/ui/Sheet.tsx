import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from "react-native";
import type { ReactNode } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { useTheme } from "@/theme";
import { AppText } from "./AppText";
import { IconButton } from "./IconButton";

type SheetProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  kicker?: string;
  children: ReactNode;
};

// Mobile take on the web's custom modal pattern (theme-modal-overlay +
// theme-modal-panel): a dimmed backdrop and a bottom panel.
export const Sheet = ({ isOpen, onClose, title, kicker, children }: SheetProps) => {
  const { colors, radius } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, justifyContent: "flex-end" }}
      >
        <Pressable
          accessibilityLabel="Close"
          onPress={onClose}
          style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.overlay }}
        />
        <View
          style={{
            maxHeight: "88%",
            backgroundColor: colors.card,
            borderTopLeftRadius: radius + 8,
            borderTopRightRadius: radius + 8,
            borderWidth: 1,
            borderColor: colors.pillBorder,
            paddingBottom: insets.bottom + 12,
          }}
        >
          <View style={{ alignItems: "center", paddingTop: 8 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 20,
              paddingTop: 10,
              paddingBottom: 6,
            }}
          >
            <View style={{ flex: 1 }}>
              {kicker ? (
                <AppText variant="kicker" size={9} tone="primary">
                  {kicker}
                </AppText>
              ) : null}
              <AppText variant="display" size={20} numberOfLines={1}>
                {title}
              </AppText>
            </View>
            <IconButton
              accessibilityLabel="Close"
              onPress={onClose}
              icon={<X size={20} color={colors.mutedForeground} />}
            />
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8, gap: 16 }}
          >
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
