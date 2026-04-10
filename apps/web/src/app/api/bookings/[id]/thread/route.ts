import { NextRequest, NextResponse } from "next/server";
import {
  createClientFromRequest,
  unauthorizedResponse,
} from "@/lib/supabase/api";

/**
 * GET /api/bookings/[id]/thread — get or create thread for a booking,
 * returning the thread and all messages with sender names.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createClientFromRequest(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return unauthorizedResponse();

  // Try to find existing thread
  let { data: thread } = await supabase
    .from("threads")
    .select("*")
    .eq("booking_id", id)
    .single();

  // Create if it doesn't exist
  if (!thread) {
    const { data: created, error } = await supabase
      .from("threads")
      .insert({ booking_id: id })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    thread = created;
  }

  // Fetch messages with sender profile
  const { data: messages, error: msgError } = await supabase
    .from("messages")
    .select("*, sender:profiles!messages_sender_id_fkey(full_name)")
    .eq("thread_id", thread.id)
    .order("created_at", { ascending: true });

  if (msgError) {
    return NextResponse.json({ error: msgError.message }, { status: 500 });
  }

  return NextResponse.json({
    data: {
      thread,
      messages: messages ?? [],
    },
  });
}
