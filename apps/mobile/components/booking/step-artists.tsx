import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import type { RosterEntry } from "@clubstack/shared";
import { getMyRoster } from "@/lib/agency-roster";

export interface ArtistEntry {
  dj_profile_id: string;
  name: string;
  fee: number;
  commission_pct: number;
  payment_split_pct: number;
}

interface StepArtistsProps {
  artists: ArtistEntry[];
  onChange: (artists: ArtistEntry[]) => void;
}

export function StepArtists({ artists, onChange }: StepArtistsProps) {
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyRoster()
      .then(setRoster)
      .catch(() => setRoster([]))
      .finally(() => setLoading(false));
  }, []);

  const addArtist = (entry: RosterEntry) => {
    if (artists.some((a) => a.dj_profile_id === entry.dj_profile_id)) return;
    onChange([
      ...artists,
      {
        dj_profile_id: entry.dj_profile_id,
        name: entry.dj_profile.name,
        fee: entry.dj_profile.rate_min ?? 0,
        commission_pct: entry.commission_pct,
        payment_split_pct: 100,
      },
    ]);
  };

  const removeArtist = (profileId: string) => {
    onChange(artists.filter((a) => a.dj_profile_id !== profileId));
  };

  const updateArtist = (
    profileId: string,
    field: "fee" | "commission_pct" | "payment_split_pct",
    value: number
  ) => {
    onChange(
      artists.map((a) =>
        a.dj_profile_id === profileId ? { ...a, [field]: value } : a
      )
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  const availableRoster = roster.filter(
    (r) =>
      r.status === "active" &&
      !artists.some((a) => a.dj_profile_id === r.dj_profile_id)
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Selected Artists</Text>
      {artists.length === 0 ? (
        <Text style={styles.empty}>No artists added yet</Text>
      ) : (
        artists.map((artist) => (
          <View key={artist.dj_profile_id} style={styles.artistCard}>
            <View style={styles.artistHeader}>
              <Text style={styles.artistName}>{artist.name}</Text>
              <Pressable onPress={() => removeArtist(artist.dj_profile_id)}>
                <Text style={styles.removeText}>Remove</Text>
              </Pressable>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Fee ($)</Text>
              <TextInput
                style={styles.fieldInput}
                value={String(artist.fee)}
                onChangeText={(v) =>
                  updateArtist(artist.dj_profile_id, "fee", Number(v) || 0)
                }
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#555"
              />
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Commission %</Text>
              <TextInput
                style={styles.fieldInput}
                value={String(artist.commission_pct)}
                onChangeText={(v) =>
                  updateArtist(
                    artist.dj_profile_id,
                    "commission_pct",
                    Number(v) || 0
                  )
                }
                keyboardType="numeric"
                placeholder="15"
                placeholderTextColor="#555"
              />
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Payment Split %</Text>
              <TextInput
                style={styles.fieldInput}
                value={String(artist.payment_split_pct)}
                onChangeText={(v) =>
                  updateArtist(
                    artist.dj_profile_id,
                    "payment_split_pct",
                    Number(v) || 0
                  )
                }
                keyboardType="numeric"
                placeholder="100"
                placeholderTextColor="#555"
              />
            </View>
          </View>
        ))
      )}

      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
        Add from Roster
      </Text>
      {availableRoster.length === 0 ? (
        <Text style={styles.empty}>
          {roster.length === 0
            ? "No artists on your roster yet"
            : "All roster artists have been added"}
        </Text>
      ) : (
        availableRoster.map((entry) => (
          <Pressable
            key={entry.id}
            onPress={() => addArtist(entry)}
            style={({ pressed }) => [
              styles.rosterItem,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.rosterName}>{entry.dj_profile.name}</Text>
            <Text style={styles.addText}>+ Add</Text>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  empty: {
    fontSize: 14,
    color: "#555",
    fontStyle: "italic",
  },
  artistCard: {
    backgroundColor: "#111",
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
  },
  artistHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  artistName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  removeText: {
    fontSize: 13,
    color: "#ff4444",
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 13,
    color: "#888",
  },
  fieldInput: {
    backgroundColor: "#1a1a1a",
    color: "#fff",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    width: 100,
    textAlign: "right",
    fontVariant: ["tabular-nums"],
  },
  rosterItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#222",
  },
  rosterName: {
    fontSize: 15,
    color: "#fff",
  },
  addText: {
    fontSize: 14,
    color: "#00e5cc",
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.7,
  },
});
