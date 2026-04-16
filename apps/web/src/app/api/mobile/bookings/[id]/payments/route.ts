import { NextRequest, NextResponse } from "next/server";
import {
  createClientFromRequest,
  unauthorizedResponse,
} from "@/lib/supabase/api";
import { getPaymentsFromClient } from "@/lib/payments/payment-api";

/**
 * GET /api/mobile/bookings/[id]/payments
 * Get all payments for a booking.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createClientFromRequest(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const payments = await getPaymentsFromClient(supabase, id);

  return NextResponse.json({ data: payments });
}
