import { NextRequest, NextResponse } from "next/server";
import {
  createClientFromRequest,
  unauthorizedResponse,
} from "@/lib/supabase/api";
import { generateInvoiceFromClient } from "@/lib/invoice/invoice-api";

/**
 * POST /api/mobile/bookings/[id]/invoice
 * Generate an invoice for a booking.
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
  const result = await generateInvoiceFromClient(supabase, id);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(
    { data: { invoiceId: result.invoiceId } },
    { status: 201 }
  );
}
