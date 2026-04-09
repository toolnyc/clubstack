import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import type { ArtistEntry } from "./step-artists";
import type { DateEntry } from "./step-dates";
import type { EventDetails } from "./step-event";

interface StepReviewProps {
  artists: ArtistEntry[];
  dates: DateEntry[];
  event: EventDetails;
}

function formatCurrency(amount: number) {
  return `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function StepReview({ artists, dates, event }: StepReviewProps) {
  const totalFees = artists.reduce((sum, a) => sum + a.fee, 0);
  const totalCommission = artists.reduce(
    (sum, a) => sum + (a.fee * a.payment_split_pct * a.commission_pct) / 10000,
    0
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Artists</Text>
      {artists.map((artist) => (
        <View key={artist.dj_profile_id} style={styles.reviewCard}>
          <Text style={styles.cardName}>{artist.name}</Text>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Fee</Text>
            <Text style={styles.value}>{formatCurrency(artist.fee)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Commission</Text>
            <Text style={styles.value}>{artist.commission_pct}%</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Split</Text>
            <Text style={styles.value}>{artist.payment_split_pct}%</Text>
          </View>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Dates</Text>
      {dates.map((date, i) => (
        <View key={i} style={styles.reviewCard}>
          <Text style={styles.cardName}>{date.date || "No date set"}</Text>
          {date.event_name ? (
            <Text style={styles.subtext}>{date.event_name}</Text>
          ) : null}
          {date.set_time ? (
            <Text style={styles.subtext}>Set: {date.set_time}</Text>
          ) : null}
        </View>
      ))}

      <Text style={styles.sectionTitle}>Event</Text>
      <View style={styles.reviewCard}>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Payer</Text>
          <Text style={styles.value}>
            {event.payer_type
              ? event.payer_type.charAt(0).toUpperCase() +
                event.payer_type.slice(1)
              : "Not set"}
          </Text>
        </View>
        {event.notes ? (
          <Text style={[styles.subtext, { marginTop: 8 }]}>{event.notes}</Text>
        ) : null}
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.detailRow}>
          <Text style={styles.summaryLabel}>Total Fees</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalFees)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.summaryLabel}>Est. Commission</Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(totalCommission)}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 16,
  },
  reviewCard: {
    backgroundColor: "#111",
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
  },
  cardName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 6,
  },
  subtext: {
    fontSize: 13,
    color: "#888",
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
  summaryCard: {
    backgroundColor: "#111",
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  summaryLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    fontVariant: ["tabular-nums"],
  },
});
