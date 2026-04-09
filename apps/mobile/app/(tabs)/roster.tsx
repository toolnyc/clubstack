import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import type { RosterEntry } from "@clubstack/shared";

import { Text, View, useThemeColor } from "@/components/Themed";
import { useAuth } from "@/lib/auth-context";
import { getAgency, getRoster, reorderRoster } from "@/lib/agency-roster";

export default function RosterScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const tint = useThemeColor({}, "tint");
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      setLoading(true);
      getAgency(user.id)
        .then((agency) => {
          if (!agency) {
            setLoading(false);
            return;
          }
          setAgencyId(agency.id);
          return getRoster(agency.id).then(setRoster);
        })
        .finally(() => setLoading(false));
    }, [user])
  );

  const handleMoveUp = async (index: number) => {
    if (index === 0 || !agencyId) return;
    const newRoster = [...roster];
    [newRoster[index - 1], newRoster[index]] = [
      newRoster[index],
      newRoster[index - 1],
    ];
    setRoster(newRoster);
    await reorderRoster(
      agencyId,
      newRoster.map((r) => r.id)
    );
  };

  const handleMoveDown = async (index: number) => {
    if (index === roster.length - 1 || !agencyId) return;
    const newRoster = [...roster];
    [newRoster[index], newRoster[index + 1]] = [
      newRoster[index + 1],
      newRoster[index],
    ];
    setRoster(newRoster);
    await reorderRoster(
      agencyId,
      newRoster.map((r) => r.id)
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={tint} />
      </View>
    );
  }

  if (!agencyId) {
    return (
      <View style={styles.centered}>
        <FontAwesome name="building" size={48} color="#ccc" />
        <Text style={styles.emptyTitle}>No Agency</Text>
        <Text style={styles.emptySubtitle}>
          Set up your agency profile to manage a roster
        </Text>
      </View>
    );
  }

  if (roster.length === 0) {
    return (
      <View style={styles.centered}>
        <FontAwesome name="users" size={48} color="#ccc" />
        <Text style={styles.emptyTitle}>No Artists Yet</Text>
        <Text style={styles.emptySubtitle}>
          Invite DJs to build your roster
        </Text>
        <Pressable
          style={[styles.ctaButton, { backgroundColor: tint }]}
          onPress={() =>
            router.push({ pathname: "/roster/invite", params: { agencyId } })
          }
        >
          <Text style={styles.ctaText}>Invite First Artist</Text>
        </Pressable>
      </View>
    );
  }

  const statusColor = (status: string) => {
    if (status === "active") return "#22c55e";
    if (status === "pending") return "#f59e0b";
    return "#999";
  };

  const renderItem = ({
    item,
    index,
  }: {
    item: RosterEntry;
    index: number;
  }) => (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/roster/${item.id}`)}
    >
      <View style={styles.cardBody}>
        <View style={styles.nameRow}>
          <Text style={styles.djName}>{item.dj_profile.name}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor(item.status) + "20" },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: statusColor(item.status) },
              ]}
            />
            <Text
              style={[styles.statusText, { color: statusColor(item.status) }]}
            >
              {item.status}
            </Text>
          </View>
        </View>
        {item.dj_profile.location && (
          <Text style={styles.location}>{item.dj_profile.location}</Text>
        )}
        <Text style={styles.commission}>{item.commission_pct}% commission</Text>
      </View>
      <View style={styles.reorderButtons}>
        <Pressable
          onPress={() => handleMoveUp(index)}
          style={styles.arrowButton}
          disabled={index === 0}
        >
          <FontAwesome
            name="chevron-up"
            size={12}
            color={index === 0 ? "#ddd" : "#666"}
          />
        </Pressable>
        <Pressable
          onPress={() => handleMoveDown(index)}
          style={styles.arrowButton}
          disabled={index === roster.length - 1}
        >
          <FontAwesome
            name="chevron-down"
            size={12}
            color={index === roster.length - 1 ? "#ddd" : "#666"}
          />
        </Pressable>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={roster}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
      <Pressable
        style={[styles.fab, { backgroundColor: tint }]}
        onPress={() =>
          router.push({ pathname: "/roster/invite", params: { agencyId } })
        }
      >
        <FontAwesome name="plus" size={20} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, paddingBottom: 80 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 12,
  },
  emptyTitle: { fontSize: 20, fontWeight: "bold" },
  emptySubtitle: { fontSize: 14, color: "#999", textAlign: "center" },
  ctaButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  ctaText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f8f8f8",
    marginBottom: 10,
  },
  cardBody: { flex: 1, backgroundColor: "transparent" },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "transparent",
  },
  djName: { fontSize: 16, fontWeight: "600" },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: "500", textTransform: "capitalize" },
  location: { fontSize: 13, color: "#999", marginTop: 2 },
  commission: { fontSize: 13, color: "#666", marginTop: 4 },
  reorderButtons: {
    gap: 4,
    backgroundColor: "transparent",
  },
  arrowButton: {
    padding: 8,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
