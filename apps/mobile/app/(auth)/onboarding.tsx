import { useState } from "react";
import {
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import type { UserType } from "@clubstack/shared";

import { Text, View, useThemeColor } from "@/components/Themed";
import { useAuth } from "@/lib/auth-context";

const ROLES: { type: UserType; label: string; description: string }[] = [
  { type: "dj", label: "DJ", description: "Get booked and manage gigs" },
  {
    type: "agency",
    label: "Agency",
    description: "Manage a roster of artists",
  },
  {
    type: "promoter",
    label: "Promoter",
    description: "Find DJs and plan events",
  },
  {
    type: "venue_contact",
    label: "Venue",
    description: "Discover and book DJs",
  },
];

export default function OnboardingScreen() {
  const { createProfile } = useAuth();
  const textColor = useThemeColor({}, "text");
  const borderColor = useThemeColor({ light: "#ccc", dark: "#333" }, "tint");
  const buttonBg = useThemeColor({ light: "#000", dark: "#fff" }, "text");
  const buttonTextColor = useThemeColor(
    { light: "#fff", dark: "#000" },
    "background"
  );
  const [step, setStep] = useState<"role" | "name">("role");
  const [selectedRole, setSelectedRole] = useState<UserType | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleRoleSelect(role: UserType) {
    setSelectedRole(role);
    setStep("name");
  }

  async function handleSubmit() {
    if (!selectedRole || !displayName.trim()) return;
    setLoading(true);
    setError(null);

    const { error: err } = await createProfile(
      selectedRole,
      displayName.trim()
    );
    setLoading(false);

    if (err) {
      setError(err);
    } else {
      router.replace("/(tabs)");
    }
  }

  const nameLabel =
    selectedRole === "venue_contact" ? "Venue name" : "Your name";

  if (step === "role") {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>What brings you here?</Text>
        <Text style={styles.subtitle}>Choose your role to get started</Text>

        {ROLES.map((role) => (
          <Pressable
            key={role.type}
            style={[styles.roleCard, { borderColor }]}
            onPress={() => handleRoleSelect(role.type)}
          >
            <Text style={styles.roleLabel}>{role.label}</Text>
            <Text style={styles.roleDesc}>{role.description}</Text>
          </Pressable>
        ))}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        <Pressable onPress={() => setStep("role")}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>

        <Text style={styles.title}>{nameLabel}</Text>
        <Text style={styles.subtitle}>This is how others will see you</Text>

        <TextInput
          style={[styles.input, { color: textColor, borderColor }]}
          placeholder={nameLabel}
          placeholderTextColor="#999"
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
          editable={!loading}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          style={[
            styles.button,
            { backgroundColor: buttonBg },
            loading && styles.buttonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={loading || !displayName.trim()}
        >
          {loading ? (
            <ActivityIndicator color={buttonTextColor} />
          ) : (
            <Text style={[styles.buttonText, { color: buttonTextColor }]}>
              Get started
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
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 32,
  },
  back: {
    fontSize: 16,
    color: "#2f95dc",
    marginBottom: 24,
  },
  roleCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  roleLabel: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  roleDesc: {
    fontSize: 14,
    opacity: 0.6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
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
});
