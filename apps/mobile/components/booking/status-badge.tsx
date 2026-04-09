import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { BookingStatus } from "@clubstack/shared";

type StatusValue = BookingStatus | "cancelled";

const STATUS_COLORS: Record<StatusValue, { bg: string; text: string }> = {
  draft: { bg: "#333", text: "#aaa" },
  contract_sent: { bg: "#0e3a3a", text: "#00e5cc" },
  signed: { bg: "#0e3a3a", text: "#00e5cc" },
  deposit_paid: { bg: "#1a3a1a", text: "#00ff88" },
  balance_paid: { bg: "#1a3a1a", text: "#00ff88" },
  completed: { bg: "#1a3a1a", text: "#00ff88" },
  cancelled: { bg: "#3a1a1a", text: "#ff4444" },
};

const STATUS_LABELS: Record<StatusValue, string> = {
  draft: "Draft",
  contract_sent: "Contract Sent",
  signed: "Signed",
  deposit_paid: "Deposit Paid",
  balance_paid: "Balance Paid",
  completed: "Completed",
  cancelled: "Cancelled",
};

interface StatusBadgeProps {
  status: StatusValue;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const colors = STATUS_COLORS[status] ?? STATUS_COLORS.draft;

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>
        {STATUS_LABELS[status] ?? status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
