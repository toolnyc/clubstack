import React, { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import {
  getThread,
  sendMessage,
  type MessageWithSender,
} from "@/lib/booking-thread";
import { MessageBubble } from "@/components/messaging/message-bubble";
import { MessageInput } from "@/components/messaging/message-input";
import { supabase } from "@/lib/supabase";

function isSameDay(a: string, b: string): boolean {
  return a.slice(0, 10) === b.slice(0, 10);
}

function formatDateSeparator(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";

  return d.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

export default function ThreadScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const loadThread = useCallback(async () => {
    if (!bookingId) return;
    try {
      const detail = await getThread(bookingId);
      setMessages(detail.messages);
    } catch {
      setMessages([]);
    }
  }, [bookingId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      // Get current user ID
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) setCurrentUserId(user.id);
      });
      loadThread().finally(() => setLoading(false));
    }, [loadThread])
  );

  const handleSend = async (content: string) => {
    if (!bookingId || sending) return;
    setSending(true);

    // Optimistic update
    const optimistic: MessageWithSender = {
      id: `temp-${Date.now()}`,
      thread_id: "",
      sender_id: currentUserId,
      content,
      is_system: false,
      created_at: new Date().toISOString(),
      sender: { display_name: "You" },
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const sent = await sendMessage(bookingId, content);
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? sent : m))
      );
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    }
    setSending(false);
  };

  // Build list items with date separators (reversed for inverted FlatList)
  const listItems: (MessageWithSender | { type: "separator"; date: string })[] =
    [];
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (i === 0 || !isSameDay(messages[i - 1].created_at, msg.created_at)) {
      listItems.push({ type: "separator", date: msg.created_at });
    }
    listItems.push(msg);
  }
  // Reverse for inverted FlatList (newest at bottom)
  const reversed = [...listItems].reverse();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No messages yet</Text>
          <Text style={styles.emptySubtext}>
            Start the conversation about this booking
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={reversed}
          inverted
          keyExtractor={(item) =>
            "type" in item ? `sep-${item.date}` : item.id
          }
          renderItem={({ item }) => {
            if ("type" in item) {
              return (
                <View style={styles.dateSeparator}>
                  <Text style={styles.dateSeparatorText}>
                    {formatDateSeparator(item.date)}
                  </Text>
                </View>
              );
            }
            return (
              <MessageBubble
                message={item}
                isOwnMessage={item.sender_id === currentUserId}
              />
            );
          }}
          contentContainerStyle={styles.listContent}
        />
      )}
      <MessageInput onSend={handleSend} disabled={sending} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#555",
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: "#444",
  },
  listContent: {
    paddingVertical: 12,
  },
  dateSeparator: {
    alignItems: "center",
    paddingVertical: 12,
  },
  dateSeparatorText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#555",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
