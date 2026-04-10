import { NextRequest, NextResponse } from "next/server";
import {
  createClientFromRequest,
  unauthorizedResponse,
} from "@/lib/supabase/api";
import { getDefaultClauses } from "@/lib/contract/clause-defaults";

/**
 * GET /api/bookings/[id]/contract — get contract with clauses for a booking.
 * Returns null data if no contract exists yet.
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

  const { data: contract } = await supabase
    .from("contracts")
    .select("*")
    .eq("booking_id", id)
    .single();

  if (!contract) {
    return NextResponse.json({ data: null });
  }

  const { data: clauses } = await supabase
    .from("contract_clauses")
    .select("*")
    .eq("contract_id", contract.id)
    .order("sort_order", { ascending: true });

  return NextResponse.json({
    data: { contract, clauses: clauses ?? [] },
  });
}

/**
 * POST /api/bookings/[id]/contract — create contract with default clauses.
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

  // Create contract
  const { data: contract, error: contractError } = await supabase
    .from("contracts")
    .insert({
      booking_id: id,
      status: "draft",
      signature_config: "agency_only",
    })
    .select("*")
    .single();

  if (contractError) {
    return NextResponse.json({ error: contractError.message }, { status: 500 });
  }

  // Insert default clauses
  const defaults = getDefaultClauses();
  const { error: clausesError } = await supabase
    .from("contract_clauses")
    .insert(
      defaults.map((c, i) => ({
        contract_id: contract.id,
        clause_type: c.type,
        title: c.title,
        content: c.content,
        is_enabled: true,
        sort_order: i,
      }))
    );

  if (clausesError) {
    return NextResponse.json({ error: clausesError.message }, { status: 500 });
  }

  // Fetch clauses back
  const { data: clauses } = await supabase
    .from("contract_clauses")
    .select("*")
    .eq("contract_id", contract.id)
    .order("sort_order", { ascending: true });

  return NextResponse.json(
    { data: { contract, clauses: clauses ?? [] } },
    { status: 201 }
  );
}

/**
 * PATCH /api/bookings/[id]/contract — update contract fields (signature_config).
 */
export async function PATCH(
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

  const { signature_config } = body as { signature_config?: string };
  if (
    signature_config &&
    !["agency_only", "agency_and_artist"].includes(signature_config)
  ) {
    return NextResponse.json(
      { error: "Invalid signature_config" },
      { status: 400 }
    );
  }

  const { data: contract } = await supabase
    .from("contracts")
    .select("id")
    .eq("booking_id", id)
    .single();

  if (!contract) {
    return NextResponse.json({ error: "No contract found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};
  if (signature_config) updates.signature_config = signature_config;

  const { data, error } = await supabase
    .from("contracts")
    .update(updates)
    .eq("id", contract.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
