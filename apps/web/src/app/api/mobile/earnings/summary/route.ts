import { NextRequest, NextResponse } from "next/server";
import {
  createClientFromRequest,
  unauthorizedResponse,
} from "@/lib/supabase/api";
import { getEarningsSummaryFromClient } from "@/lib/payments/earnings-api";

/**
 * GET /api/mobile/earnings/summary
 * Aggregated earnings summary for the authenticated DJ.
 */
export async function GET(request: NextRequest) {
  const supabase = createClientFromRequest(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return unauthorizedResponse();

  const { data, error } = await getEarningsSummaryFromClient(supabase, user.id);

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  return NextResponse.json({ data });
}
