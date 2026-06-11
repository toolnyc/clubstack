import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useFocusEffect, useRouter } from "expo-router";
import type {
  BookingStatus,
  BookingCost,
  BookingTravel,
  CostCategory,
  TravelType,
} from "@clubstack/shared";
import {
  updateBookingStatus,
  getBookingPayments,
  type PaymentRecord,
} from "@/lib/api";
import {
  getBooking,
  addCost,
  updateCost,
  removeCost,
  addTravel,
  updateTravel,
  removeTravel,
  type BookingDetail,
} from "@/lib/bookings";
import { calculateDealSummary, type DealSummary } from "@clubstack/shared";
import { StatusBadge } from "@/components/booking/status-badge";
import { DealMathCard } from "@/components/booking/deal-math-card";
import { BookingStatusActions } from "@/components/booking/booking-status-actions";
import { CostFormModal } from "@/components/booking/cost-form-modal";
import { TravelFormModal } from "@/components/booking/travel-form-modal";
import { PaymentStatusCard } from "@/components/payment-status-card";
import { shareOfferPdf } from "@/lib/offer-pdf";
import { generateInvoice } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const OFFER_SHAREABLE_STATUSES: BookingStatus[] = ["draft", "contract_sent"];

const TRAVEL_TYPE_LABELS: Record<TravelType, string> = {
  flight: "Flight",
  hotel: "Hotel",
  ground_transport: "Ground Transport",
};

function formatTravelSummary(t: BookingTravel): string {
  if (t.type === "flight") {
    const route =
      t.departure_airport && t.arrival_airport
        ? `${t.departure_airport} → ${t.arrival_airport}`
        : "";
    const flight = [t.airline, t.flight_number].filter(Boolean).join(" ");
    return [flight, route].filter(Boolean).join(" · ") || "Flight";
  }
  if (t.type === "hotel") {
    return t.hotel_name || "Hotel";
  }
  return t.transport_details || "Ground Transport";
}

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [detail, setDetail] = useState<BookingDetail | null>(null);
  const [dealMath, setDealMath] = useState<DealSummary | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [sharingOffer, setSharingOffer] = useState(false);

  // Cost modal state
  const [costModalVisible, setCostModalVisible] = useState(false);
  const [editingCost, setEditingCost] = useState<BookingCost | null>(null);

  // Travel modal state
  const [travelModalVisible, setTravelModalVisible] = useState(false);
  const [editingTravel, setEditingTravel] = useState<BookingTravel | null>(
    null
  );

  const loadData = useCallback(async () => {
    if (!id) return;
    const [detailRes, paymentsRes] = await Promise.allSettled([
      getBooking(id),
      getBookingPayments(id),
    ]);
    if (detailRes.status === "fulfilled") {
      setDetail(detailRes.value);
      setDealMath(
        calculateDealSummary(detailRes.value.artists, detailRes.value.costs)
      );
    }
    if (paymentsRes.status === "fulfilled" && paymentsRes.value.data) {
      setPayments(paymentsRes.value.data);
    }
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

  // --- Cost handlers ---
  const handleSaveCost = async (data: {
    description: string;
    amount: number;
    category: CostCategory | null;
  }) => {
    if (!id) return;
    setCostModalVisible(false);
    try {
      if (editingCost) {
        await updateCost(editingCost.id, data);
      } else {
        await addCost(id, data);
      }
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Could not save cost"
      );
    }
    setEditingCost(null);
    await loadData();
  };

  const handleEditCost = (cost: BookingCost) => {
    setEditingCost(cost);
    setCostModalVisible(true);
  };

  const handleDeleteCost = (cost: BookingCost) => {
    if (!id) return;
    Alert.alert("Delete Cost", `Remove "${cost.description}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await removeCost(cost.id);
          } catch (err) {
            Alert.alert(
              "Error",
              err instanceof Error ? err.message : "Could not delete cost"
            );
          }
          await loadData();
        },
      },
    ]);
  };

  // --- Travel handlers ---
  const handleSaveTravel = async (data: Record<string, unknown>) => {
    if (!id) return;
    setTravelModalVisible(false);
    try {
      if (editingTravel) {
        await updateTravel(editingTravel.id, data);
      } else {
        await addTravel(id, data);
      }
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Could not save travel"
      );
    }
    setEditingTravel(null);
    await loadData();
  };

  const handleEditTravel = (travel: BookingTravel) => {
    setEditingTravel(travel);
    setTravelModalVisible(true);
  };

  const handleShareOffer = async () => {
    if (!id || sharingOffer) return;
    setSharingOffer(true);
    try {
      await shareOfferPdf(id);
    } catch (err) {
      Alert.alert(
        "Could not share offer",
        err instanceof Error ? err.message : "Unknown error"
      );
    } finally {
      setSharingOffer(false);
    }
  };

  const [generatingInvoice, setGeneratingInvoice] = useState(false);

  const handleGenerateInvoice = async () => {
    if (!id || generatingInvoice) return;
    setGeneratingInvoice(true);
    const { data, error } = await generateInvoice(id);
    setGeneratingInvoice(false);
    if (error) {
      Alert.alert("Error", error);
    } else if (data?.invoiceId) {
      router.push(`/invoices/${data.invoiceId}`);
    }
  };

  const handleDeleteTravel = (travel: BookingTravel) => {
    if (!id) return;
    Alert.alert(
      "Delete Travel",
      `Remove this ${TRAVEL_TYPE_LABELS[travel.type].toLowerCase()} entry?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await removeTravel(travel.id);
            } catch (err) {
              Alert.alert(
                "Error",
                err instanceof Error ? err.message : "Could not delete travel"
              );
            }
            await loadData();
          },
        },
      ]
    );
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

  const { booking, dates, artists, costs, travel } = detail;

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
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
              <Text style={styles.cardSecondary}>
                Load-in: {d.load_in_time}
              </Text>
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
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Costs</Text>
          <Pressable
            onPress={() => {
              setEditingCost(null);
              setCostModalVisible(true);
            }}
          >
            <Text style={styles.addButton}>+ Add</Text>
          </Pressable>
        </View>
        {costs.length === 0 ? (
          <Text style={styles.emptyText}>No costs added</Text>
        ) : (
          costs.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => handleEditCost(c)}
              onLongPress={() => handleDeleteCost(c)}
              style={styles.card}
            >
              <View style={styles.detailRow}>
                <Text style={styles.cardPrimary}>{c.description}</Text>
                <Text style={styles.value}>${c.amount.toFixed(2)}</Text>
              </View>
              {c.category ? (
                <Text style={styles.cardSecondary}>{c.category}</Text>
              ) : null}
            </Pressable>
          ))
        )}

        {/* Travel */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Travel</Text>
          <Pressable
            onPress={() => {
              setEditingTravel(null);
              setTravelModalVisible(true);
            }}
          >
            <Text style={styles.addButton}>+ Add</Text>
          </Pressable>
        </View>
        {travel.length === 0 ? (
          <Text style={styles.emptyText}>No travel added</Text>
        ) : (
          travel.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => handleEditTravel(t)}
              onLongPress={() => handleDeleteTravel(t)}
              style={styles.card}
            >
              <View style={styles.detailRow}>
                <Text style={styles.travelType}>
                  {TRAVEL_TYPE_LABELS[t.type]}
                </Text>
                {t.cost != null ? (
                  <Text style={styles.value}>${t.cost.toFixed(2)}</Text>
                ) : null}
              </View>
              <Text style={styles.cardPrimary}>{formatTravelSummary(t)}</Text>
              {t.notes ? (
                <Text style={styles.cardSecondary}>{t.notes}</Text>
              ) : null}
            </Pressable>
          ))
        )}

        {/* Messages */}
        <Pressable
          style={styles.messagesRow}
          onPress={() =>
            router.push({
              pathname: "/booking/thread",
              params: { bookingId: id },
            })
          }
        >
          <Text style={styles.sectionTitle}>Messages</Text>
          <Text style={styles.messagesArrow}>→</Text>
        </Pressable>

        {/* Contract */}
        <Pressable
          style={styles.messagesRow}
          onPress={() =>
            router.push({
              pathname: "/booking/contract",
              params: { bookingId: id },
            })
          }
        >
          <Text style={styles.sectionTitle}>Contract</Text>
          <Text style={styles.messagesArrow}>→</Text>
        </Pressable>

        {/* Share offer PDF */}
        {OFFER_SHAREABLE_STATUSES.includes(booking.status as BookingStatus) ? (
          <Pressable
            style={[
              styles.messagesRow,
              sharingOffer ? styles.rowDisabled : null,
            ]}
            onPress={handleShareOffer}
            disabled={sharingOffer}
          >
            <Text style={styles.sectionTitle}>
              {sharingOffer ? "Preparing PDF…" : "Share Offer PDF"}
            </Text>
            {sharingOffer ? (
              <ActivityIndicator color="#888" />
            ) : (
              <Text style={styles.messagesArrow}>↗</Text>
            )}
          </Pressable>
        ) : null}

        {/* Generate Invoice */}
        {["signed", "deposit_paid", "balance_paid", "completed"].includes(
          booking.status
        ) ? (
          <Pressable
            style={[
              styles.messagesRow,
              generatingInvoice ? styles.rowDisabled : null,
            ]}
            onPress={handleGenerateInvoice}
            disabled={generatingInvoice}
          >
            <Text style={styles.sectionTitle}>
              {generatingInvoice ? "Generating…" : "Generate Invoice"}
            </Text>
            {generatingInvoice ? (
              <ActivityIndicator color="#888" />
            ) : (
              <Text style={styles.messagesArrow}>+</Text>
            )}
          </Pressable>
        ) : null}

        {/* Deal Math */}
        {dealMath ? (
          <DealMathCard
            summary={dealMath}
            artistNames={artists.map((a) => a.dj_profile.name)}
          />
        ) : null}

        {/* Payments */}
        {["signed", "deposit_paid", "balance_paid", "completed"].includes(
          booking.status
        ) ? (
          <PaymentStatusCard
            bookingId={booking.id}
            bookingStatus={booking.status as BookingStatus}
            depositPct={booking.deposit_pct ?? 50}
            payments={payments}
            isPayer={user?.id === booking.payer_user_id}
            onPaymentComplete={loadData}
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

      <CostFormModal
        visible={costModalVisible}
        existing={editingCost}
        onSave={handleSaveCost}
        onClose={() => {
          setCostModalVisible(false);
          setEditingCost(null);
        }}
      />

      <TravelFormModal
        visible={travelModalVisible}
        existing={editingTravel}
        onSave={handleSaveTravel}
        onClose={() => {
          setTravelModalVisible(false);
          setEditingTravel(null);
        }}
      />
    </>
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 8,
  },
  addButton: {
    fontSize: 14,
    fontWeight: "600",
    color: "#00e5cc",
  },
  emptyText: {
    fontSize: 14,
    color: "#555",
    fontStyle: "italic",
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
  travelType: {
    fontSize: 11,
    fontWeight: "700",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  notesText: {
    fontSize: 14,
    color: "#ccc",
    lineHeight: 20,
  },
  messagesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 8,
    padding: 14,
    marginTop: 20,
  },
  rowDisabled: {
    opacity: 0.6,
  },
  messagesArrow: {
    fontSize: 16,
    color: "#555",
  },
});
