import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { getErrorMessage } from "@/api/client";
import { loginInputSchema } from "@/types/auth";
import { useAuth } from "@/hooks/useAuth";
import { AppText, BrandMark, Button, Screen, TextField } from "@/components/ui";

export const LoginScreen = () => {
  const router = useRouter();
  const { login, isLoginPending } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setFormError(null);
    const parsed = loginInputSchema.safeParse({ email: email.trim(), password });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({ email: flat.email?.[0], password: flat.password?.[0] });
      return;
    }
    setFieldErrors({});

    try {
      await login(parsed.data);
      if (router.canDismiss()) {
        router.dismiss();
      } else {
        router.replace("/");
      }
    } catch (error) {
      setFormError(getErrorMessage(error, "Could not sign in."));
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 24, gap: 18 }} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: "center", gap: 10, marginVertical: 12 }}>
            <BrandMark size={56} />
            <AppText variant="kicker" size={10} tone="primary">
              Welcome back
            </AppText>
            <AppText variant="display" size={28}>
              Sign in to Interis
            </AppText>
          </View>

          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            placeholder="you@example.com"
            error={fieldErrors.email}
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            textContentType="password"
            placeholder="••••••••"
            error={fieldErrors.password}
            onSubmitEditing={handleSubmit}
            returnKeyType="go"
          />

          {formError ? (
            <AppText tone="destructive" size={13}>
              {formError}
            </AppText>
          ) : null}

          <Button label="Sign in" onPress={handleSubmit} loading={isLoginPending} size="lg" fullWidth />
          <Button
            label="No account yet? Create one"
            variant="ghost"
            onPress={() => router.replace("/register")}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
};
