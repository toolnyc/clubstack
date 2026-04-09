import { useState } from "react";
import {
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";

import { Text, View, useThemeColor } from "@/components/Themed";
import { useAuth } from "@/lib/auth-context";

export default function SignInScreen() {
  const { signIn, verifyOtp } = useAuth();
  const textColor = useThemeColor({}, "text");
  const borderColor = useThemeColor({ light: "#ccc", dark: "#333" }, "tint");
  const buttonBg = useThemeColor({ light: "#000", dark: "#fff" }, "text");
  const buttonText = useThemeColor(
    { light: "#fff", dark: "#000" },
    "background"
  );
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSendCode() {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);

    const { error: err } = await signIn(email.trim());
    setLoading(false);

    if (err) {
      setError(err);
    } else {
      setStep("code");
    }
  }

  async function handleVerifyCode() {
    if (!otpCode.trim()) return;
    setLoading(true);
    setError(null);

    const { error: err } = await verifyOtp(email.trim(), otpCode.trim());
    setLoading(false);

    if (err) {
      setError(err);
    }
    // On success, onAuthStateChange in auth-context handles navigation
  }

  if (step === "code") {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Enter your code</Text>
          <Text style={styles.subtitle}>We sent a 6-digit code to {email}</Text>

          <TextInput
            style={[styles.codeInput, { color: textColor, borderColor }]}
            placeholder="000000"
            placeholderTextColor="#999"
            value={otpCode}
            onChangeText={setOtpCode}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
            editable={!loading}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            style={[
              styles.button,
              { backgroundColor: buttonBg },
              loading && styles.buttonDisabled,
            ]}
            onPress={handleVerifyCode}
            disabled={loading || otpCode.length < 6}
          >
            {loading ? (
              <ActivityIndicator color={buttonText} />
            ) : (
              <Text style={[styles.buttonText, { color: buttonText }]}>
                Verify
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => {
              setStep("email");
              setOtpCode("");
              setError(null);
            }}
          >
            <Text style={styles.link}>Use a different email</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Clubstack</Text>
        <Text style={styles.subtitle}>Sign in with your email</Text>

        <TextInput
          style={[styles.input, { color: textColor, borderColor }]}
          placeholder="you@example.com"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          editable={!loading}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          style={[
            styles.button,
            { backgroundColor: buttonBg },
            loading && styles.buttonDisabled,
          ]}
          onPress={handleSendCode}
          disabled={loading || !email.trim()}
        >
          {loading ? (
            <ActivityIndicator color={buttonText} />
          ) : (
            <Text style={[styles.buttonText, { color: buttonText }]}>
              Send code
            </Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 32,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  codeInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
    letterSpacing: 8,
  },
  error: {
    color: "#ef4444",
    marginBottom: 12,
    fontSize: 14,
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  link: {
    color: "#2f95dc",
    fontSize: 14,
    marginTop: 16,
    textAlign: "center",
  },
});
