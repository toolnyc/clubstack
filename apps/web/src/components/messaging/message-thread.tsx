"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendMessage } from "@/lib/messaging/actions";
import type { Message } from "@/types";

interface MessageThreadProps {
  threadId: string;
  initialMessages: Message[];
  currentUserId: string;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

function groupMessagesByDate(messages: Message[]): Map<string, Message[]> {
  const groups = new Map<string, Message[]>();
  for (const msg of messages) {
    const key = new Date(msg.created_at).toDateString();
    const existing = groups.get(key);
    if (existing) {
      existing.push(msg);
    } else {
      groups.set(key, [msg]);
    }
  }
  return groups;
}

export function MessageThread({
  threadId,
  initialMessages,
  currentUserId,
}: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Subscribe to realtime messages
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`thread-${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => {
            // Avoid duplicates (from optimistic updates)
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setInput("");

    const { error } = await sendMessage(threadId, trimmed);

    if (error) {
      // Restore input on failure
      setInput(trimmed);
    }

    setSending(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const grouped = groupMessagesByDate(messages);

  return (
    <div className="msg-thread">
      <div className="msg-thread__list" ref={listRef}>
        {messages.length === 0 && (
          <div className="msg-thread__empty">
            No messages yet. Start the conversation.
          </div>
        )}

        {Array.from(grouped.entries()).map(([dateKey, dateMessages]) => (
          <div key={dateKey}>
            <div className="msg-thread__date-divider">
              <span>{formatDate(dateMessages[0].created_at)}</span>
            </div>

            {dateMessages.map((msg) => {
              if (msg.is_system) {
                return (
                  <div key={msg.id} className="msg-thread__system">
                    {msg.content}
                  </div>
                );
              }

              const isOwn = msg.sender_id === currentUserId;

              return (
                <div
                  key={msg.id}
                  className={`msg-thread__bubble ${
                    isOwn
                      ? "msg-thread__bubble--own"
                      : "msg-thread__bubble--other"
                  }`}
                >
                  <div className="msg-thread__content">{msg.content}</div>
                  <div className="msg-thread__time">
                    {formatTime(msg.created_at)}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      <div className="msg-thread__compose">
        <textarea
          className="msg-thread__input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          disabled={sending}
        />
        <button
          className="btn btn--primary btn--sm msg-thread__send"
          onClick={handleSend}
          disabled={sending || !input.trim()}
          type="button"
        >
          Send
        </button>
      </div>
    </div>
  );
}
