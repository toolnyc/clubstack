import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { DealSummary } from "@clubstack/shared";

interface DealMathCardProps {
  summary: DealSummary;
  artistNames?: string[];
}

function formatCurrency(amount: number) {
  return `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function DealMathCard({ summary, artistNames }: DealMathCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Deal Summary</Text>

      {summary.artists.map((artist, i) => (
        <View key={i} style={styles.artistRow}>
          <Text style={styles.artistName}>
            {artistNames?.[i] ?? `Artist ${i + 1}`}
          </Text>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Fee</Text>
            <Text style={styles.value}>{formatCurrency(artist.fee)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Split Fee</Text>
            <Text style={styles.value}>{formatCurrency(artist.splitFee)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Commission</Text>
            <Text style={styles.value}>
              {formatCurrency(artist.commission)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Net to Artist</Text>
            <Text style={styles.valueGreen}>
              {formatCurrency(artist.netToArtist)}
            </Text>
          </View>
        </View>
      ))}

      <View style={styles.separator} />

      <View style={styles.detailRow}>
        <Text style={styles.label}>Gross Fees</Text>
        <Text style={styles.value}>{formatCurrency(summary.grossFees)}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.label}>Costs</Text>
        <Text style={styles.value}>{formatCurrency(summary.totalCosts)}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.label}>Total Commission</Text>
        <Text style={styles.value}>
          {formatCurrency(summary.totalCommission)}
        </Text>
      </View>
      <View style={[styles.detailRow, styles.totalRow]}>
        <Text style={styles.totalLabel}>Total Owed</Text>
        <Text style={styles.totalValue}>
          {formatCurrency(summary.totalOwed)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#111",
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  artistRow: {
    marginBottom: 12,
  },
  artistName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 6,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
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
  valueGreen: {
    fontSize: 13,
    color: "#00ff88",
    fontVariant: ["tabular-nums"],
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#333",
    marginVertical: 12,
  },
  totalRow: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#333",
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  totalValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    fontVariant: ["tabular-nums"],
  },
});
