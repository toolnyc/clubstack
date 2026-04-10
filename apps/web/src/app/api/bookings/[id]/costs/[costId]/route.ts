import { NextRequest, NextResponse } from "next/server";
import {
  createClientFromRequest,
  unauthorizedResponse,
} from "@/lib/supabase/api";
import { z } from "zod";

const updateCostSchema = z.object({
  description: z.string().min(1).max(500).optional(),
  amount: z.number().min(0).optional(),
  category: z
    .enum(["travel", "accommodation", "equipment", "other"])
    .nullable()
    .optional(),
});

/**
 * PATCH /api/bookings/[id]/costs/[costId] — update a cost line item.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; costId: string }> }
) {
  const { costId } = await params;
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

  const parsed = updateCostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(parsed.data)) {
    if (value !== undefined) {
      updates[key] = value;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("booking_costs")
    .update(updates)
    .eq("id", costId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

/**
 * DELETE /api/bookings/[id]/costs/[costId] — remove a cost line item.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; costId: string }> }
) {
  const { costId } = await params;
  const supabase = createClientFromRequest(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return unauthorizedResponse();

  const { error } = await supabase
    .from("booking_costs")
    .delete()
    .eq("id", costId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
