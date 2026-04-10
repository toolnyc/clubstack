import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { supabase } from "./supabase";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

/**
 * Downloads the branded offer PDF for a booking and hands it to the native
 * share sheet. Never renders or parses the PDF on-device — bytes only.
 *
 * Resolves when the share sheet is presented (or dismissed). Throws on
 * network / auth / sharing failures so callers can surface errors.
 */
export async function shareOfferPdf(bookingId: string): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    throw new Error("Not authenticated");
  }

  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error("Sharing is not available on this device");
  }

  // Download to app cache — survives the session, gets cleared by OS later.
  const destination = new File(Paths.cache, `offer-${bookingId}.pdf`);
  if (destination.exists) {
    destination.delete();
  }

  const url = `${API_BASE_URL}/api/bookings/${bookingId}/offer-pdf`;
  const downloaded = await File.downloadFileAsync(url, destination, {
    headers: { Authorization: `Bearer ${token}` },
    idempotent: true,
  });

  await Sharing.shareAsync(downloaded.uri, {
    mimeType: "application/pdf",
    dialogTitle: "Share offer PDF",
    UTI: "com.adobe.pdf",
  });
}
