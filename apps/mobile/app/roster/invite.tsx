import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { Text, View, useThemeColor } from "@/components/Themed";
import { inviteArtist } from "@/lib/agency-roster";

export default function InviteArtistScreen() {
  const { agencyId } = useLocalSearchParams<{ agencyId: string }>();
  const router = useRouter();
  const tint = useThemeColor({}, "tint");
  const textColor = useThemeColor({}, "text");

  const [email, setEmail] = useState("");
  const [commission, setCommission] = useState("15");
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleInvite = async () => {
    if (!agencyId) return;
    if (!email.trim()) {
      setErrorMsg("Email is required");
      return;
    }

    setSending(true);
    setErrorMsg(null);
    try {
      const result = await inviteArtist(
        agencyId,
        email.trim(),
        Number(commission) || 15
      );
      if (result.error) {
        setErrorMsg(result.error);
      } else {
        Alert.alert("Invited", `Invitation sent to ${email.trim()}`);
        router.back();
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to send invite");
    } finally {
      setSending(false);
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Invite Artist</Text>
      <Text style={styles.subtitle}>
        The DJ must have a Clubstack account to be invited
      </Text>

      <Text style={styles.label}>Email Address</Text>
      <TextInput
        style={[styles.input, { color: textColor }]}
        value={email}
        onChangeText={setEmail}
        placeholder="dj@example.com"
        placeholderTextColor="#999"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Text style={styles.label}>Commission (%)</Text>
      <View style={styles.commissionRow}>
        <TextInput
          style={[styles.input, styles.commissionInput, { color: textColor }]}
          value={commission}
          onChangeText={setCommission}
          keyboardType="numeric"
          placeholder="15"
          placeholderTextColor="#999"
        />
        <Text style={styles.percentLabel}>%</Text>
      </View>

      {errorMsg && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      <View style={styles.buttonRow}>
        <Pressable style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Pressable
          style={[styles.sendButton, { backgroundColor: tint }]}
          onPress={handleInvite}
          disabled={sending}
        >
          {sending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.sendText}>Send Invite</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#999", marginBottom: 24 },
  label: { fontSize: 14, fontWeight: "500", marginBottom: 4, marginTop: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  commissionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "transparent",
  },
  commissionInput: { width: 80, textAlign: "center" },
  percentLabel: { fontSize: 16, fontWeight: "500" },
  errorBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#fef2f2",
  },
  errorText: { color: "#ef4444", fontSize: 14 },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 32,
    backgroundColor: "transparent",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    alignItems: "center",
  },
  cancelText: { fontSize: 16, fontWeight: "500" },
  sendButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  sendText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
