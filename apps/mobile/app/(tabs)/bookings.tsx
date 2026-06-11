import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import type { Booking, BookingStatus } from "@clubstack/shared";
import { getBookings } from "@/lib/bookings";
import { BookingListItem } from "@/components/booking/booking-list-item";

type FilterKey = "all" | "active" | "completed" | "cancelled";

const ACTIVE_STATUSES: BookingStatus[] = [
  "draft",
  "contract_sent",
  "signed",
  "deposit_paid",
  "balance_paid",
];

function filterBookings(bookings: Booking[], filter: FilterKey): Booking[] {
  switch (filter) {
    case "active":
      return bookings.filter((b) =>
        ACTIVE_STATUSES.includes(b.status as BookingStatus)
      );
    case "completed":
      return bookings.filter((b) => b.status === "completed");
    case "cancelled":
      return bookings.filter((b) => b.status === "cancelled");
    default:
      return bookings;
  }
}

export default function BookingsScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("all");

  const loadBookings = useCallback(async () => {
    try {
      setBookings(await getBookings());
    } catch {
      setBookings([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadBookings().finally(() => setLoading(false));
    }, [loadBookings])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  }, [loadBookings]);

  const filtered = filterBookings(bookings, filter);
  const filters: FilterKey[] = ["all", "active", "completed", "cancelled"];

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {filters.map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.filterChip, filter === f && styles.filterActive]}
          >
            <Text
              style={[
                styles.filterText,
                filter === f && styles.filterTextActive,
              ]}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#fff" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BookingListItem
              booking={item}
              onPress={() => router.push(`/booking/${item.id}`)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#fff"
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>
                {filter === "all" ? "No bookings yet" : `No ${filter} bookings`}
              </Text>
            </View>
          }
          contentContainerStyle={
            filtered.length === 0 ? styles.emptyList : undefined
          }
        />
      )}

      <Pressable
        onPress={() => router.push("/booking/create")}
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#222",
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#111",
  },
  filterActive: {
    backgroundColor: "#fff",
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#888",
  },
  filterTextActive: {
    color: "#000",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 15,
    color: "#555",
  },
  emptyList: {
    flex: 1,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  fabText: {
    fontSize: 28,
    fontWeight: "300",
    color: "#000",
    lineHeight: 30,
  },
});
