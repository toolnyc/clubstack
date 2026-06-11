import type { Message, Thread } from "@clubstack/shared";

import { supabase } from "./supabase";

export type MessageWithSender = Message & {
  sender: { display_name: string | null } | null;
};

export interface ThreadDetail {
  thread: Thread;
  messages: MessageWithSender[];
}

const SENDER_SELECT =
  "*, sender:profiles!messages_sender_id_fkey(display_name)";

async function getOrCreateThread(bookingId: string): Promise<Thread> {
  const { data: existing } = await supabase
    .from("threads")
    .select("*")
    .eq("booking_id", bookingId)
    .maybeSingle();

  if (existing) return existing as Thread;

  const { data: created, error } = await supabase
    .from("threads")
    .insert({ booking_id: bookingId })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return created as Thread;
}

export async function getThread(bookingId: string): Promise<ThreadDetail> {
  const thread = await getOrCreateThread(bookingId);

  const { data: messages, error } = await supabase
    .from("messages")
    .select(SENDER_SELECT)
    .eq("thread_id", thread.id)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return {
    thread,
    messages: (messages as unknown as MessageWithSender[]) ?? [],
  };
}

export async function sendMessage(
  bookingId: string,
  content: string
): Promise<MessageWithSender> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const thread = await getOrCreateThread(bookingId);

  const { data, error } = await supabase
    .from("messages")
    .insert({
      thread_id: thread.id,
      sender_id: session.user.id,
      content: content.trim(),
      is_system: false,
    })
    .select(SENDER_SELECT)
    .single();

  if (error) throw new Error(error.message);
  return data as unknown as MessageWithSender;
}
