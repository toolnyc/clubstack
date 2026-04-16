"use server";

import { createClient } from "@/lib/supabase/server";
import type { Payment } from "@clubstack/shared";
import { chargeBookingFromClient, getPaymentsFromClient } from "./payment-api";

export async function chargeDeposit(bookingId: string) {
  const supabase = await createClient();
  return chargeBookingFromClient(supabase, bookingId, "deposit");
}

export async function chargeBalance(bookingId: string) {
  const supabase = await createClient();
  return chargeBookingFromClient(supabase, bookingId, "balance");
}

/**
 * Get payments for a booking.
 */
export async function getPayments(bookingId: string): Promise<Payment[]> {
  const supabase = await createClient();
  return getPaymentsFromClient(supabase, bookingId);
}
