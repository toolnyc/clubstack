/**
 * Generate a unique invoice number in format CS-YYYYMMDD-XXXX
 * where XXXX is 4 random uppercase alphanumeric characters.
 */
export function generateInvoiceNumber(date?: Date): string {
  const d = date ?? new Date();
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const datePart = `${year}${month}${day}`;

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }

  return `CS-${datePart}-${suffix}`;
}
