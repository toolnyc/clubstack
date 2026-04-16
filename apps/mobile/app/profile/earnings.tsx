import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";

import {
  getEarningsSummary,
  getEarningsHistory,
  type EarningsSummary,
  type EarningsEntry,
} from "@/lib/api";
import { EarningsSummaryCards } from "@/components/earnings-summary";

const STATUS_COLORS: Record<string, string> = {
  completed: "#2ecc71",
  pending: "#f39c12",
  upcoming: "#00e5cc",
  cancelled: "#e74c3c",
};

function EarningsRow({ entry }: { entry: EarningsEntry }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowTitle}>
          {entry.eventName ?? entry.venueName ?? "Gig"}
        </Text>
        <Text style={styles.rowDate}>{entry.date}</Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.rowAmount}>${entry.net.toFixed(2)}</Text>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.dot,
              { backgroundColor: STATUS_COLORS[entry.status] ?? "#888" },
            ]}
          />
          <Text style={styles.rowStatus}>{entry.status}</Text>
        </View>
      </View>
    </View>
  );
}

export default function EarningsScreen() {
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [history, setHistory] = useState<EarningsEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      Promise.all([getEarningsSummary(), getEarningsHistory()]).then(
        ([summaryRes, historyRes]) => {
          if (summaryRes.data) setSummary(summaryRes.data);
          if (historyRes.data) setHistory(historyRes.data);
          setLoading(false);
        }
      );
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={history}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <EarningsRow entry={item} />}
      ListHeaderComponent={
        <>
          {summary && <EarningsSummaryCards summary={summary} />}
          {history.length > 0 && (
            <Text style={styles.sectionTitle}>Gig History</Text>
          )}
        </>
      }
      ListEmptyComponent={<Text style={styles.emptyText}>No earnings yet</Text>}
    />
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
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
  },
  rowLeft: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 2,
  },
  rowDate: {
    fontSize: 13,
    color: "#888",
  },
  rowRight: {
    alignItems: "flex-end",
  },
  rowAmount: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    fontVariant: ["tabular-nums"],
    marginBottom: 2,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  rowStatus: {
    fontSize: 11,
    color: "#888",
    textTransform: "capitalize",
  },
  emptyText: {
    fontSize: 14,
    color: "#555",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 40,
  },
});
