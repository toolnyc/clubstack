import React from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import type { BookingStatus } from "@clubstack/shared";

type StatusValue = BookingStatus | "cancelled";

const VALID_TRANSITIONS: Record<StatusValue, readonly StatusValue[]> = {
  draft: ["contract_sent", "cancelled"],
  contract_sent: ["signed", "cancelled"],
  signed: ["deposit_paid", "cancelled"],
  deposit_paid: ["balance_paid", "cancelled"],
  balance_paid: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

const ACTION_LABELS: Record<StatusValue, string> = {
  draft: "Draft",
  contract_sent: "Send Contract",
  signed: "Mark Signed",
  deposit_paid: "Mark Deposit Paid",
  balance_paid: "Mark Balance Paid",
  completed: "Mark Completed",
  cancelled: "Cancel Booking",
};

interface BookingStatusActionsProps {
  currentStatus: StatusValue;
  onTransition: (newStatus: StatusValue) => void;
  isLoading?: boolean;
}

export function BookingStatusActions({
  currentStatus,
  onTransition,
  isLoading,
}: BookingStatusActionsProps) {
  const nextStatuses = VALID_TRANSITIONS[currentStatus] ?? [];

  if (nextStatuses.length === 0) return null;

  const handleCancel = () => {
    Alert.alert("Cancel Booking", "Are you sure you want to cancel?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: () => onTransition("cancelled"),
      },
    ]);
  };

  const primaryActions = nextStatuses.filter((s) => s !== "cancelled");
  const canCancel = nextStatuses.includes("cancelled");

  return (
    <View style={styles.container}>
      {primaryActions.map((status) => (
        <Pressable
          key={status}
          onPress={() => onTransition(status)}
          disabled={isLoading}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.pressed,
            isLoading && styles.disabled,
          ]}
        >
          <Text style={styles.primaryText}>{ACTION_LABELS[status]}</Text>
        </Pressable>
      ))}
      {canCancel ? (
        <Pressable
          onPress={handleCancel}
          disabled={isLoading}
          style={({ pressed }) => [
            styles.cancelButton,
            pressed && styles.pressed,
            isLoading && styles.disabled,
          ]}
        >
          <Text style={styles.cancelText}>Cancel Booking</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    marginVertical: 8,
  },
  primaryButton: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryText: {
    color: "#000",
    fontSize: 15,
    fontWeight: "700",
  },
  cancelButton: {
    backgroundColor: "transparent",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ff4444",
  },
  cancelText: {
    color: "#ff4444",
    fontSize: 15,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.4,
  },
});
