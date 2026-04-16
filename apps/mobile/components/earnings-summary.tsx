import { StyleSheet, Text, View } from "react-native";
import type { EarningsSummary } from "@/lib/api";

interface EarningsSummaryCardsProps {
  summary: EarningsSummary;
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={styles.card}>
      <Text style={[styles.amount, { color }]}>${value.toFixed(2)}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

export function EarningsSummaryCards({ summary }: EarningsSummaryCardsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <StatCard label="Earned" value={summary.totalEarned} color="#2ecc71" />
        <StatCard
          label="Pending"
          value={summary.totalPending}
          color="#f39c12"
        />
      </View>
      <View style={styles.row}>
        <StatCard
          label="Upcoming"
          value={summary.totalUpcoming}
          color="#00e5cc"
        />
        <View style={styles.card}>
          <Text style={[styles.amount, { color: "#fff" }]}>
            {summary.gigCount}
          </Text>
          <Text style={styles.label}>Total gigs</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  card: {
    flex: 1,
    backgroundColor: "#111",
    borderRadius: 8,
    padding: 16,
  },
  amount: {
    fontSize: 22,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
