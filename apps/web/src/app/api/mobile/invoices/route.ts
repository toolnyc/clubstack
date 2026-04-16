import { NextRequest, NextResponse } from "next/server";
import {
  createClientFromRequest,
  unauthorizedResponse,
} from "@/lib/supabase/api";
import { getAllInvoicesFromClient } from "@/lib/invoice/invoice-api";

/**
 * GET /api/mobile/invoices
 * List all invoices for the authenticated user's bookings.
 */
export async function GET(request: NextRequest) {
  const supabase = createClientFromRequest(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return unauthorizedResponse();

  const { data, error } = await getAllInvoicesFromClient(supabase);

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ data });
}
