import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { getErrorMessage } from "@/api/client";
import { registerInputSchema } from "@/types/auth";
import { useAuth } from "@/hooks/useAuth";
import { AppText, BrandMark, Button, Screen, TextField } from "@/components/ui";

type FieldErrors = { username?: string; email?: string; password?: string };

export const RegisterScreen = () => {
  const router = useRouter();
  const { register, isRegisterPending } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setFormError(null);
    const parsed = registerInputSchema.safeParse({
      username: username.trim().toLowerCase(),
      email: email.trim(),
      password,
    });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        username: flat.username?.[0],
        email: flat.email?.[0],
        password: flat.password?.[0],
      });
      return;
    }
    setFieldErrors({});

    try {
      await register(parsed.data);
      if (router.canDismiss()) {
        router.dismiss();
      } else {
        router.replace("/");
      }
    } catch (error) {
      setFormError(getErrorMessage(error, "Could not create your account."));
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 24, gap: 18 }} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: "center", gap: 10, marginVertical: 12 }}>
            <BrandMark size={56} />
            <AppText variant="kicker" size={10} tone="primary">
              Start your journal
            </AppText>
            <AppText variant="display" size={28}>
              Create an account
            </AppText>
          </View>

          <TextField
            label="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username-new"
            placeholder="cinephile_42"
            hint="3-20 characters: lowercase letters, numbers, underscores"
            error={fieldErrors.username}
          />
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
            autoComplete="password-new"
            textContentType="newPassword"
            placeholder="At least 8 characters"
            error={fieldErrors.password}
          />

          {formError ? (
            <AppText tone="destructive" size={13}>
              {formError}
            </AppText>
          ) : null}

          <Button label="Create account" onPress={handleSubmit} loading={isRegisterPending} size="lg" fullWidth />
          <Button label="Already have an account? Sign in" variant="ghost" onPress={() => router.replace("/login")} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
};
