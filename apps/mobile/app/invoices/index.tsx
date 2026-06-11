import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import { getAllInvoices, type InvoiceListEntry } from "@/lib/invoices";

const STATUS_COLORS: Record<string, string> = {
  draft: "#888",
  sent: "#f39c12",
  paid: "#2ecc71",
  void: "#e74c3c",
};

function InvoiceRow({ entry }: { entry: InvoiceListEntry }) {
  const router = useRouter();

  return (
    <Pressable
      style={styles.row}
      onPress={() => router.push(`/invoices/${entry.id}`)}
    >
      <View style={styles.rowLeft}>
        <Text style={styles.invoiceNumber}>{entry.invoiceNumber}</Text>
        <Text style={styles.rowSecondary}>
          {entry.eventName ?? entry.venueName ?? "Booking"}
          {entry.bookingDate ? ` · ${entry.bookingDate}` : ""}
        </Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.amount}>${entry.totalAmount.toFixed(2)}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: (STATUS_COLORS[entry.status] ?? "#888") + "22" },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: STATUS_COLORS[entry.status] ?? "#888" },
            ]}
          >
            {entry.status}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function InvoicesScreen() {
  const [invoices, setInvoices] = useState<InvoiceListEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      getAllInvoices()
        .then(setInvoices)
        .catch(() => setInvoices([]))
        .finally(() => setLoading(false));
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
      data={invoices}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <InvoiceRow entry={item} />}
      ListEmptyComponent={<Text style={styles.emptyText}>No invoices yet</Text>}
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
  invoiceNumber: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    fontVariant: ["tabular-nums"],
    marginBottom: 2,
  },
  rowSecondary: {
    fontSize: 13,
    color: "#888",
  },
  rowRight: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    fontVariant: ["tabular-nums"],
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  emptyText: {
    fontSize: 14,
    color: "#555",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 40,
  },
});
