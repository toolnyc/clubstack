import { NextRequest, NextResponse } from "next/server";
import {
  createClientFromRequest,
  unauthorizedResponse,
} from "@/lib/supabase/api";

/**
 * PATCH /api/bookings/[id]/contract/clauses/[clauseId] — toggle or update clause.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; clauseId: string }> }
) {
  const { clauseId } = await params;
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

  const { is_enabled, content } = body as {
    is_enabled?: boolean;
    content?: string;
  };

  const updates: Record<string, unknown> = {};
  if (typeof is_enabled === "boolean") updates.is_enabled = is_enabled;
  if (typeof content === "string") updates.content = content;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("contract_clauses")
    .update(updates)
    .eq("id", clauseId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
