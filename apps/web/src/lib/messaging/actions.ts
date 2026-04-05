"use server";

import { createClient } from "@/lib/supabase/server";
import type { Thread, Message } from "@/types";

export async function getOrCreateThread(
  bookingId: string
): Promise<{ thread: Thread | null; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { thread: null, error: "Not authenticated" };

  // Try to find existing thread
  const { data: existing } = await supabase
    .from("threads")
    .select("*")
    .eq("booking_id", bookingId)
    .single();

  if (existing) return { thread: existing as Thread, error: null };

  // Create new thread
  const { data: created, error } = await supabase
    .from("threads")
    .insert({ booking_id: bookingId })
    .select("*")
    .single();

  if (error) return { thread: null, error: error.message };

  return { thread: created as Thread, error: null };
}

export async function getMessages(
  threadId: string
): Promise<{ messages: Message[]; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { messages: [], error: "Not authenticated" };

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (error) return { messages: [], error: error.message };

  return { messages: (data as Message[]) ?? [], error: null };
}

export async function sendMessage(
  threadId: string,
  content: string
): Promise<{ message: Message | null; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { message: null, error: "Not authenticated" };

  const trimmed = content.trim();
  if (!trimmed) return { message: null, error: "Message cannot be empty" };

  const { data, error } = await supabase
    .from("messages")
    .insert({
      thread_id: threadId,
      sender_id: user.id,
      content: trimmed,
      is_system: false,
    })
    .select("*")
    .single();

  if (error) return { message: null, error: error.message };

  return { message: data as Message, error: null };
}

export async function sendSystemMessage(
  threadId: string,
  content: string
): Promise<{ message: Message | null; error: string | null }> {
  const supabase = await createClient();

  const trimmed = content.trim();
  if (!trimmed) return { message: null, error: "Message cannot be empty" };

  const { data, error } = await supabase
    .from("messages")
    .insert({
      thread_id: threadId,
      sender_id: null,
      content: trimmed,
      is_system: true,
    })
    .select("*")
    .single();

  if (error) return { message: null, error: error.message };

  return { message: data as Message, error: null };
}
