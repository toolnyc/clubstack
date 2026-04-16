import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useFocusEffect } from "expo-router";

import { getInvoice, type InvoiceDetail } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  draft: "#888",
  sent: "#f39c12",
  paid: "#2ecc71",
  void: "#e74c3c",
};

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [detail, setDetail] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      setLoading(true);
      getInvoice(id).then(({ data }) => {
        if (data) setDetail(data);
        setLoading(false);
      });
    }, [id])
  );

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
        <Text style={styles.errorText}>Invoice not found</Text>
      </View>
    );
  }

  const { invoice, lineItems } = detail;
  const statusColor = STATUS_COLORS[invoice.status] ?? "#888";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
        <View
          style={[styles.statusBadge, { backgroundColor: statusColor + "22" }]}
        >
          <Text style={[styles.statusText, { color: statusColor }]}>
            {invoice.status}
          </Text>
        </View>
      </View>

      <Text style={styles.date}>
        Created {new Date(invoice.created_at).toLocaleDateString()}
      </Text>

      {/* Line Items */}
      <Text style={styles.sectionTitle}>Line Items</Text>
      {lineItems.map((item) => (
        <View key={item.id} style={styles.lineItem}>
          <View style={styles.lineItemLeft}>
            <Text style={styles.lineItemDescription}>{item.description}</Text>
            <Text style={styles.lineItemCategory}>{item.category}</Text>
          </View>
          <Text style={styles.lineItemAmount}>${item.amount.toFixed(2)}</Text>
        </View>
      ))}

      {/* Total */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalAmount}>
          ${invoice.total_amount.toFixed(2)} {invoice.currency.toUpperCase()}
        </Text>
      </View>

      {/* Dates */}
      {invoice.due_date && (
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Due</Text>
          <Text style={styles.metaValue}>{invoice.due_date}</Text>
        </View>
      )}
      {invoice.sent_at && (
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Sent</Text>
          <Text style={styles.metaValue}>
            {new Date(invoice.sent_at).toLocaleDateString()}
          </Text>
        </View>
      )}
      {invoice.paid_at && (
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Paid</Text>
          <Text style={styles.metaValue}>
            {new Date(invoice.paid_at).toLocaleDateString()}
          </Text>
        </View>
      )}
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
    marginBottom: 4,
  },
  invoiceNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    fontVariant: ["tabular-nums"],
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  date: {
    fontSize: 13,
    color: "#888",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  lineItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
  },
  lineItemLeft: {
    flex: 1,
  },
  lineItemDescription: {
    fontSize: 14,
    color: "#fff",
    marginBottom: 2,
  },
  lineItemCategory: {
    fontSize: 12,
    color: "#888",
    textTransform: "capitalize",
  },
  lineItemAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    fontVariant: ["tabular-nums"],
    marginLeft: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#222",
    paddingTop: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    fontVariant: ["tabular-nums"],
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  metaLabel: {
    fontSize: 13,
    color: "#888",
  },
  metaValue: {
    fontSize: 13,
    color: "#ccc",
  },
});
