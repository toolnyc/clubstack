import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { ContractStatus } from "@clubstack/shared";

const STATUS_COLORS: Record<ContractStatus, { bg: string; text: string }> = {
  draft: { bg: "#1a1a2e", text: "#8888cc" },
  sent: { bg: "#1a2e1a", text: "#88cc88" },
  signed: { bg: "#0a2a2a", text: "#00e5cc" },
  voided: { bg: "#2e1a1a", text: "#cc8888" },
};

interface ContractStatusBadgeProps {
  status: ContractStatus;
}

export function ContractStatusBadge({ status }: ContractStatusBadgeProps) {
  const colors = STATUS_COLORS[status];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>
        {status.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  text: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
