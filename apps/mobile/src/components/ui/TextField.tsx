import { useState } from "react";
import { TextInput, View, type TextInputProps } from "react-native";
import { useTheme } from "@/theme";
import { AppText } from "./AppText";

type TextFieldProps = TextInputProps & {
  label?: string;
  error?: string | null;
  hint?: string;
};

export const TextField = ({ label, error, hint, style, multiline, onFocus, onBlur, ...rest }: TextFieldProps) => {
  const { colors, radius, fonts } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <AppText variant="kicker" tone="muted" size={10}>
          {label}
        </AppText>
      ) : null}
      <TextInput
        placeholderTextColor={colors.faint}
        selectionColor={colors.primary}
        multiline={multiline}
        onFocus={(event) => {
          setIsFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setIsFocused(false);
          onBlur?.(event);
        }}
        style={[
          {
            minHeight: multiline ? 110 : 46,
            paddingHorizontal: 14,
            paddingVertical: multiline ? 12 : 0,
            borderRadius: radius,
            borderWidth: 1,
            borderColor: error ? colors.destructive : isFocused ? colors.primary : colors.border,
            backgroundColor: colors.input,
            color: colors.foreground,
            fontFamily: fonts.body,
            fontSize: 15,
            textAlignVertical: multiline ? "top" : "center",
          },
          style,
        ]}
        {...rest}
      />
      {error ? (
        <AppText size={12} tone="destructive">
          {error}
        </AppText>
      ) : hint ? (
        <AppText size={12} tone="faint">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
};
