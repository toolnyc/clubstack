import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MessageThread } from "./message-thread";
import type { Message } from "@/types";

// Mock supabase client
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    channel: () => ({
      on: () => ({
        subscribe: () => ({}),
      }),
    }),
    removeChannel: vi.fn(),
  }),
}));

// Mock server action
vi.mock("@/lib/messaging/actions", () => ({
  sendMessage: vi.fn().mockResolvedValue({ message: null, error: null }),
}));

const baseMessage: Message = {
  id: "msg-1",
  thread_id: "thread-1",
  sender_id: "user-1",
  content: "Hello there",
  is_system: false,
  created_at: new Date().toISOString(),
};

const systemMessage: Message = {
  id: "msg-2",
  thread_id: "thread-1",
  sender_id: null,
  content: "Contract signed",
  is_system: true,
  created_at: new Date().toISOString(),
};

const otherUserMessage: Message = {
  id: "msg-3",
  thread_id: "thread-1",
  sender_id: "user-2",
  content: "Hey, sounds good",
  is_system: false,
  created_at: new Date().toISOString(),
};

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

describe("MessageThread", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders empty state when no messages", () => {
    render(
      <MessageThread
        threadId="thread-1"
        initialMessages={[]}
        currentUserId="user-1"
      />
    );
    expect(
      screen.getByText("No messages yet. Start the conversation.")
    ).toBeInTheDocument();
  });

  it("renders user messages", () => {
    render(
      <MessageThread
        threadId="thread-1"
        initialMessages={[baseMessage]}
        currentUserId="user-1"
      />
    );
    expect(screen.getByText("Hello there")).toBeInTheDocument();
  });

  it("renders system messages with system styling", () => {
    render(
      <MessageThread
        threadId="thread-1"
        initialMessages={[systemMessage]}
        currentUserId="user-1"
      />
    );
    const systemEl = screen.getByText("Contract signed");
    expect(systemEl).toBeInTheDocument();
    expect(systemEl.className).toContain("msg-thread__system");
  });

  it("distinguishes own messages from others", () => {
    render(
      <MessageThread
        threadId="thread-1"
        initialMessages={[baseMessage, otherUserMessage]}
        currentUserId="user-1"
      />
    );

    const ownBubble = screen
      .getByText("Hello there")
      .closest(".msg-thread__bubble");
    expect(ownBubble?.className).toContain("msg-thread__bubble--own");

    const otherBubble = screen
      .getByText("Hey, sounds good")
      .closest(".msg-thread__bubble");
    expect(otherBubble?.className).toContain("msg-thread__bubble--other");
  });

  it("renders compose area with input and send button", () => {
    render(
      <MessageThread
        threadId="thread-1"
        initialMessages={[]}
        currentUserId="user-1"
      />
    );
    expect(
      screen.getByPlaceholderText("Type a message...")
    ).toBeInTheDocument();
    expect(screen.getByText("Send")).toBeInTheDocument();
  });

  it("disables send button when input is empty", () => {
    render(
      <MessageThread
        threadId="thread-1"
        initialMessages={[]}
        currentUserId="user-1"
      />
    );
    const sendButton = screen.getByText("Send");
    expect(sendButton).toBeDisabled();
  });

  it("enables send button when input has content", () => {
    render(
      <MessageThread
        threadId="thread-1"
        initialMessages={[]}
        currentUserId="user-1"
      />
    );
    const input = screen.getByPlaceholderText("Type a message...");
    fireEvent.change(input, { target: { value: "Test message" } });
    const sendButton = screen.getByText("Send");
    expect(sendButton).not.toBeDisabled();
  });

  it("clears input after sending", async () => {
    render(
      <MessageThread
        threadId="thread-1"
        initialMessages={[]}
        currentUserId="user-1"
      />
    );
    const input = screen.getByPlaceholderText(
      "Type a message..."
    ) as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: "Test message" } });
    fireEvent.click(screen.getByText("Send"));

    // Input should be cleared immediately (optimistic)
    expect(input.value).toBe("");
  });

  it("renders multiple messages in chronological order", () => {
    const messages: Message[] = [
      {
        ...baseMessage,
        id: "m1",
        content: "First",
        created_at: "2026-03-15T10:00:00Z",
      },
      {
        ...baseMessage,
        id: "m2",
        content: "Second",
        created_at: "2026-03-15T10:01:00Z",
      },
      {
        ...baseMessage,
        id: "m3",
        content: "Third",
        created_at: "2026-03-15T10:02:00Z",
      },
    ];

    render(
      <MessageThread
        threadId="thread-1"
        initialMessages={messages}
        currentUserId="user-1"
      />
    );

    const bubbles = screen.getAllByText(/First|Second|Third/);
    expect(bubbles).toHaveLength(3);
    expect(bubbles[0].textContent).toBe("First");
    expect(bubbles[1].textContent).toBe("Second");
    expect(bubbles[2].textContent).toBe("Third");
  });
});
