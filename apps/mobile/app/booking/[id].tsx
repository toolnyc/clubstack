import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import type { BookingStatus } from "@clubstack/shared";
import { getBooking, getDealMath, updateBookingStatus } from "@/lib/api";
import type { BookingDetail } from "@/lib/api";
import type { DealSummary } from "@/lib/booking-types";
import { StatusBadge } from "@/components/booking/status-badge";
import { DealMathCard } from "@/components/booking/deal-math-card";
import { BookingStatusActions } from "@/components/booking/booking-status-actions";

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [detail, setDetail] = useState<BookingDetail | null>(null);
  const [dealMath, setDealMath] = useState<DealSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    const [bookingRes, dealRes] = await Promise.all([
      getBooking(id),
      getDealMath(id),
    ]);
    if (bookingRes.data) setDetail(bookingRes.data);
    if (dealRes.data) setDealMath(dealRes.data);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData().finally(() => setLoading(false));
    }, [loadData])
  );

  const handleTransition = async (newStatus: BookingStatus | "cancelled") => {
    if (!id) return;
    setTransitioning(true);
    const { error } = await updateBookingStatus(id, newStatus);
    if (error) {
      Alert.alert("Error", error);
    } else {
      await loadData();
    }
    setTransitioning(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Booking not found</Text>
      </View>
    );
  }

  const { booking, dates, artists, costs } = detail;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Booking</Text>
        <StatusBadge status={booking.status as BookingStatus | "cancelled"} />
      </View>

      {/* Dates */}
      <Text style={styles.sectionTitle}>Dates</Text>
      {dates.map((d) => (
        <View key={d.id} style={styles.card}>
          <Text style={styles.cardPrimary}>{d.date}</Text>
          {d.event_name ? (
            <Text style={styles.cardSecondary}>{d.event_name}</Text>
          ) : null}
          {d.set_time ? (
            <Text style={styles.cardSecondary}>Set: {d.set_time}</Text>
          ) : null}
          {d.load_in_time ? (
            <Text style={styles.cardSecondary}>Load-in: {d.load_in_time}</Text>
          ) : null}
        </View>
      ))}

      {/* Artists */}
      <Text style={styles.sectionTitle}>Artists</Text>
      {artists.map((a) => (
        <View key={a.id} style={styles.card}>
          <Text style={styles.cardPrimary}>{a.dj_profile.name}</Text>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Fee</Text>
            <Text style={styles.value}>${a.fee.toFixed(2)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Commission</Text>
            <Text style={styles.value}>{a.commission_pct}%</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Split</Text>
            <Text style={styles.value}>{a.payment_split_pct}%</Text>
          </View>
        </View>
      ))}

      {/* Costs */}
      {costs.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Costs</Text>
          {costs.map((c) => (
            <View key={c.id} style={styles.card}>
              <View style={styles.detailRow}>
                <Text style={styles.cardPrimary}>{c.description}</Text>
                <Text style={styles.value}>${c.amount.toFixed(2)}</Text>
              </View>
              {c.category ? (
                <Text style={styles.cardSecondary}>{c.category}</Text>
              ) : null}
            </View>
          ))}
        </>
      ) : null}

      {/* Deal Math */}
      {dealMath ? (
        <DealMathCard
          summary={dealMath}
          artistNames={artists.map((a) => a.dj_profile.name)}
        />
      ) : null}

      {/* Notes */}
      {booking.notes ? (
        <>
          <Text style={styles.sectionTitle}>Notes</Text>
          <View style={styles.card}>
            <Text style={styles.notesText}>{booking.notes}</Text>
          </View>
        </>
      ) : null}

      {/* Actions */}
      <BookingStatusActions
        currentStatus={booking.status as BookingStatus | "cancelled"}
        onTransition={handleTransition}
        isLoading={transitioning}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  errorText: {
    color: "#ff4444",
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 20,
  },
  card: {
    backgroundColor: "#111",
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
  },
  cardPrimary: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  cardSecondary: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  label: {
    fontSize: 13,
    color: "#888",
  },
  value: {
    fontSize: 13,
    color: "#ccc",
    fontVariant: ["tabular-nums"],
  },
  notesText: {
    fontSize: 14,
    color: "#ccc",
    lineHeight: 20,
  },
});
