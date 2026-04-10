import { NextRequest, NextResponse } from "next/server";
import {
  createClientFromRequest,
  unauthorizedResponse,
} from "@/lib/supabase/api";
import { z } from "zod";

const createCostSchema = z.object({
  description: z.string().min(1).max(500),
  amount: z.number().min(0),
  category: z
    .enum(["travel", "accommodation", "equipment", "other"])
    .nullable()
    .optional(),
});

/**
 * GET /api/bookings/[id]/costs — list cost line items for a booking.
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

  const { data, error } = await supabase
    .from("booking_costs")
    .select("*")
    .eq("booking_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

/**
 * POST /api/bookings/[id]/costs — add a cost line item.
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

  const parsed = createCostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("booking_costs")
    .insert({
      booking_id: id,
      description: parsed.data.description,
      amount: parsed.data.amount,
      category: parsed.data.category ?? null,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
