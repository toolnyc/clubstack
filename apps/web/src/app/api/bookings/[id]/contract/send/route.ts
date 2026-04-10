import { NextRequest, NextResponse } from "next/server";
import {
  createClientFromRequest,
  unauthorizedResponse,
} from "@/lib/supabase/api";

/**
 * POST /api/bookings/[id]/contract/send — mark contract as sent and return signing URL.
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

  const { data: contract } = await supabase
    .from("contracts")
    .select("id, status, signing_token")
    .eq("booking_id", id)
    .single();

  if (!contract) {
    return NextResponse.json({ error: "No contract found" }, { status: 404 });
  }

  if (contract.status !== "draft") {
    return NextResponse.json(
      { error: `Contract is already ${contract.status}` },
      { status: 400 }
    );
  }

  // Update status to sent
  const { error } = await supabase
    .from("contracts")
    .update({ status: "sent" })
    .eq("id", contract.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Build signing URL
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    "http://localhost:3000";
  const signingUrl = `${baseUrl}/sign/${contract.signing_token}`;

  return NextResponse.json({
    data: { signingUrl },
  });
}
