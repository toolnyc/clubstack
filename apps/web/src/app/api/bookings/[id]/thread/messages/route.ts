import { NextRequest, NextResponse } from "next/server";
import {
  createClientFromRequest,
  unauthorizedResponse,
} from "@/lib/supabase/api";
import { z } from "zod";

const sendMessageSchema = z.object({
  content: z.string().min(1).max(5000),
});

/**
 * POST /api/bookings/[id]/thread/messages — send a message in the booking thread.
 * Auto-creates the thread if it doesn't exist yet.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createClientFromRequest(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return unauthorizedResponse();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  // Get or create thread
  let { data: thread } = await supabase
    .from("threads")
    .select("id")
    .eq("booking_id", id)
    .single();

  if (!thread) {
    const { data: created, error } = await supabase
      .from("threads")
      .insert({ booking_id: id })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    thread = created;
  }

  // Insert message
  const { data: message, error: msgError } = await supabase
    .from("messages")
    .insert({
      thread_id: thread.id,
      sender_id: user.id,
      content: parsed.data.content.trim(),
      is_system: false,
    })
    .select("*, sender:profiles!messages_sender_id_fkey(full_name)")
    .single();

  if (msgError) {
    return NextResponse.json({ error: msgError.message }, { status: 500 });
  }

  return NextResponse.json({ data: message }, { status: 201 });
}
