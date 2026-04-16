import { NextRequest, NextResponse } from "next/server";
import {
  createClientFromRequest,
  unauthorizedResponse,
} from "@/lib/supabase/api";
import { chargeBookingFromClient } from "@/lib/payments/payment-api";

/**
 * POST /api/mobile/bookings/[id]/charge-balance
 * Charge the remaining balance for a booking using the payer's saved payment method.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createClientFromRequest(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const result = await chargeBookingFromClient(supabase, id, "balance");

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ data: { success: true } });
}
