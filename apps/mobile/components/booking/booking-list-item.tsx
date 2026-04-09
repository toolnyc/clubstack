import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import type { Booking } from "@clubstack/shared";
import { StatusBadge } from "./status-badge";

interface BookingListItemProps {
  booking: Booking;
  onPress: () => void;
}

export function BookingListItem({ booking, onPress }: BookingListItemProps) {
  const date = new Date(booking.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={styles.row}>
        <Text style={styles.date}>{date}</Text>
        <StatusBadge
          status={booking.status as Parameters<typeof StatusBadge>[0]["status"]}
        />
      </View>
      {booking.notes ? (
        <Text style={styles.notes} numberOfLines={1}>
          {booking.notes}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#222",
  },
  pressed: {
    opacity: 0.7,
    backgroundColor: "#111",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  date: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  notes: {
    fontSize: 13,
    color: "#888",
    marginTop: 4,
  },
});
