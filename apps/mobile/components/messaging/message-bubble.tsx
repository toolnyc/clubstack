import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { MessageWithSender } from "@/lib/booking-thread";

interface MessageBubbleProps {
  message: MessageWithSender;
  isOwnMessage: boolean;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
  if (message.is_system) {
    return (
      <View style={styles.systemRow}>
        <Text style={styles.systemText}>{message.content}</Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.bubbleRow, isOwnMessage ? styles.ownRow : styles.otherRow]}
    >
      <View
        style={[
          styles.bubble,
          isOwnMessage ? styles.ownBubble : styles.otherBubble,
        ]}
      >
        {!isOwnMessage && message.sender?.display_name ? (
          <Text style={styles.senderName}>{message.sender.display_name}</Text>
        ) : null}
        <Text style={styles.messageText}>{message.content}</Text>
        <Text style={styles.timestamp}>{formatTime(message.created_at)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  systemRow: {
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 32,
  },
  systemText: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
    textAlign: "center",
  },
  bubbleRow: {
    paddingHorizontal: 12,
    marginVertical: 2,
  },
  ownRow: {
    alignItems: "flex-end",
  },
  otherRow: {
    alignItems: "flex-start",
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  ownBubble: {
    backgroundColor: "#1a3a35",
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: "#1a1a1a",
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 11,
    fontWeight: "700",
    color: "#00e5cc",
    marginBottom: 2,
  },
  messageText: {
    fontSize: 15,
    color: "#fff",
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 10,
    color: "#666",
    marginTop: 4,
    alignSelf: "flex-end",
  },
});
