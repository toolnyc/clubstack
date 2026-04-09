import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import type { RosterEntry } from "@clubstack/shared";

import { Text, View, useThemeColor } from "@/components/Themed";
import { useAuth } from "@/lib/auth-context";
import {
  getAgency,
  getRoster,
  removeArtist,
  updateArtist,
} from "@/lib/agency-roster";

export default function ArtistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const tint = useThemeColor({}, "tint");
  const textColor = useThemeColor({}, "text");

  const [entry, setEntry] = useState<RosterEntry | null>(null);
  const [commission, setCommission] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!user || !id) return;
      setLoading(true);
      getAgency(user.id)
        .then((agency) => {
          if (!agency) return;
          return getRoster(agency.id);
        })
        .then((roster) => {
          const found = roster?.find((r) => r.id === id) ?? null;
          setEntry(found);
          if (found) {
            setCommission(found.commission_pct.toString());
            setNotes(found.private_notes ?? "");
          }
        })
        .finally(() => setLoading(false));
    }, [user, id])
  );

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const result = await updateArtist(id, {
        commission_pct: Number(commission) || 0,
        private_notes: notes.trim() || undefined,
      });
      if (result.error) {
        Alert.alert("Error", result.error);
      } else {
        router.back();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = () => {
    if (!id || !entry) return;
    Alert.alert(
      "Remove Artist",
      `Remove ${entry.dj_profile.name} from your roster?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            const result = await removeArtist(id);
            if (result.error) {
              Alert.alert("Error", result.error);
            } else {
              router.back();
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={tint} />
      </View>
    );
  }

  if (!entry) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Artist not found</Text>
      </View>
    );
  }

  const statusColor =
    entry.status === "active"
      ? "#22c55e"
      : entry.status === "pending"
        ? "#f59e0b"
        : "#999";

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* DJ Info (read-only) */}
      <View style={styles.header}>
        <Text style={styles.name}>{entry.dj_profile.name}</Text>
        <View
          style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}
        >
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusLabel, { color: statusColor }]}>
            {entry.status}
          </Text>
        </View>
      </View>

      {entry.dj_profile.location && (
        <View style={styles.infoRow}>
          <FontAwesome name="map-marker" size={14} color="#999" />
          <Text style={styles.infoText}>{entry.dj_profile.location}</Text>
        </View>
      )}

      {(entry.dj_profile.rate_min || entry.dj_profile.rate_max) && (
        <View style={styles.infoRow}>
          <FontAwesome name="dollar" size={14} color="#999" />
          <Text style={styles.infoText}>
            {entry.dj_profile.rate_min && entry.dj_profile.rate_max
              ? `$${entry.dj_profile.rate_min} – $${entry.dj_profile.rate_max}`
              : entry.dj_profile.rate_min
                ? `From $${entry.dj_profile.rate_min}`
                : `Up to $${entry.dj_profile.rate_max}`}
          </Text>
        </View>
      )}

      {/* Editable Fields */}
      <Text style={styles.sectionTitle}>Commission</Text>
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

      <Text style={styles.sectionTitle}>Private Notes</Text>
      <TextInput
        style={[styles.input, styles.multiline, { color: textColor }]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Internal notes about this artist..."
        placeholderTextColor="#999"
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      {/* Actions */}
      <View style={styles.buttonRow}>
        <Pressable style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Pressable
          style={[styles.saveButton, { backgroundColor: tint }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </Pressable>
      </View>

      <Pressable style={styles.removeButton} onPress={handleRemove}>
        <FontAwesome name="trash" size={16} color="#ef4444" />
        <Text style={styles.removeText}>Remove from Roster</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  emptyText: { fontSize: 16, color: "#999" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
    backgroundColor: "transparent",
  },
  name: { fontSize: 24, fontWeight: "bold", flex: 1 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: 13, fontWeight: "500", textTransform: "capitalize" },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
    backgroundColor: "transparent",
  },
  infoText: { fontSize: 14, color: "#666" },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 24,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  multiline: { minHeight: 100 },
  commissionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "transparent",
  },
  commissionInput: { width: 80, textAlign: "center" },
  percentLabel: { fontSize: 16, fontWeight: "500" },
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
  saveButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  removeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#ef4444",
    borderRadius: 8,
  },
  removeText: { fontSize: 16, fontWeight: "500", color: "#ef4444" },
});
