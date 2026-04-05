import type { NotificationType } from "@/types";

interface TemplateData {
  recipientName?: string;
  djName?: string;
  agencyName?: string;
  venueName?: string;
  eventName?: string;
  eventDate?: string;
  amount?: string;
  dueDate?: string;
  contractUrl?: string;
  bookingUrl?: string;
  inviteUrl?: string;
  conflictDate?: string;
  conflictDetails?: string;
}

interface TemplateResult {
  subject: string;
  html: string;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://clubstack.studio";

function wrapHtml(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:32px 16px;font-family:system-ui,-apple-system,sans-serif;background:#0a0a0a;color:#e5e5e5;">
  <div style="max-width:560px;margin:0 auto;">
    <div style="margin-bottom:24px;">
      <img src="${APP_URL}/brand/logo/logo-long-white.svg" alt="Clubstack Studio" width="220" height="64" style="display:block;border:0;" />
    </div>
    ${body}
    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #262626;font-size:12px;color:#737373;">
      You received this because of your Clubstack notification settings.
    </div>
  </div>
</body>
</html>`;
}

function contractSent(data: TemplateData): TemplateResult {
  return {
    subject: `Contract ready to sign — ${data.eventName ?? "New Booking"}`,
    html: wrapHtml(`
      <h1 style="font-size:20px;margin:0 0 16px;">Contract Ready</h1>
      <p style="margin:0 0 12px;line-height:1.5;">
        A contract for <strong>${data.eventName ?? "your booking"}</strong>${data.venueName ? ` at ${data.venueName}` : ""}${data.eventDate ? ` on ${data.eventDate}` : ""} is ready for your signature.
      </p>
      ${data.contractUrl ? `<a href="${data.contractUrl}" style="display:inline-block;padding:10px 20px;background:#06b6d4;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;">Review &amp; Sign</a>` : ""}
    `),
  };
}

function contractSigned(data: TemplateData): TemplateResult {
  return {
    subject: `Contract signed — ${data.eventName ?? "Booking"}`,
    html: wrapHtml(`
      <h1 style="font-size:20px;margin:0 0 16px;">Contract Signed</h1>
      <p style="margin:0 0 12px;line-height:1.5;">
        The contract for <strong>${data.eventName ?? "your booking"}</strong>${data.venueName ? ` at ${data.venueName}` : ""} has been fully signed.
      </p>
      ${data.bookingUrl ? `<a href="${data.bookingUrl}" style="display:inline-block;padding:10px 20px;background:#06b6d4;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;">View Booking</a>` : ""}
    `),
  };
}

function paymentReceived(data: TemplateData): TemplateResult {
  return {
    subject: `Payment received${data.amount ? ` — ${data.amount}` : ""}`,
    html: wrapHtml(`
      <h1 style="font-size:20px;margin:0 0 16px;">Payment Received</h1>
      <p style="margin:0 0 12px;line-height:1.5;">
        ${data.amount ? `<strong>${data.amount}</strong> has` : "A payment has"} been received for <strong>${data.eventName ?? "your booking"}</strong>${data.venueName ? ` at ${data.venueName}` : ""}.
      </p>
      ${data.bookingUrl ? `<a href="${data.bookingUrl}" style="display:inline-block;padding:10px 20px;background:#06b6d4;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;">View Details</a>` : ""}
    `),
  };
}

function paymentDue(data: TemplateData): TemplateResult {
  return {
    subject: `Payment due${data.dueDate ? ` — ${data.dueDate}` : ""}`,
    html: wrapHtml(`
      <h1 style="font-size:20px;margin:0 0 16px;">Payment Due</h1>
      <p style="margin:0 0 12px;line-height:1.5;">
        ${data.amount ? `<strong>${data.amount}</strong> is` : "A payment is"} due${data.dueDate ? ` on <strong>${data.dueDate}</strong>` : ""} for <strong>${data.eventName ?? "your booking"}</strong>${data.venueName ? ` at ${data.venueName}` : ""}.
      </p>
      ${data.bookingUrl ? `<a href="${data.bookingUrl}" style="display:inline-block;padding:10px 20px;background:#06b6d4;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;">View Booking</a>` : ""}
    `),
  };
}

function bookingConfirmed(data: TemplateData): TemplateResult {
  return {
    subject: `Booking confirmed — ${data.eventName ?? "New Booking"}`,
    html: wrapHtml(`
      <h1 style="font-size:20px;margin:0 0 16px;">Booking Confirmed</h1>
      <p style="margin:0 0 12px;line-height:1.5;">
        Your booking for <strong>${data.eventName ?? "an event"}</strong>${data.venueName ? ` at ${data.venueName}` : ""}${data.eventDate ? ` on ${data.eventDate}` : ""} has been confirmed.
      </p>
      ${data.bookingUrl ? `<a href="${data.bookingUrl}" style="display:inline-block;padding:10px 20px;background:#06b6d4;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;">View Booking</a>` : ""}
    `),
  };
}

function calendarConflict(data: TemplateData): TemplateResult {
  return {
    subject: `Calendar conflict detected — ${data.conflictDate ?? "upcoming date"}`,
    html: wrapHtml(`
      <h1 style="font-size:20px;margin:0 0 16px;">Calendar Conflict</h1>
      <p style="margin:0 0 12px;line-height:1.5;">
        A scheduling conflict was detected${data.conflictDate ? ` on <strong>${data.conflictDate}</strong>` : ""}.${data.conflictDetails ? ` ${data.conflictDetails}` : ""}
      </p>
      ${data.bookingUrl ? `<a href="${data.bookingUrl}" style="display:inline-block;padding:10px 20px;background:#06b6d4;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;">Resolve Conflict</a>` : ""}
    `),
  };
}

function agencyInvite(data: TemplateData): TemplateResult {
  return {
    subject: `${data.agencyName ?? "An agency"} invited you to their roster`,
    html: wrapHtml(`
      <h1 style="font-size:20px;margin:0 0 16px;">Agency Invite</h1>
      <p style="margin:0 0 12px;line-height:1.5;">
        <strong>${data.agencyName ?? "An agency"}</strong> has invited you to join their roster on Clubstack.
      </p>
      ${data.inviteUrl ? `<a href="${data.inviteUrl}" style="display:inline-block;padding:10px 20px;background:#06b6d4;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;">View Invite</a>` : ""}
    `),
  };
}

const TEMPLATE_MAP: Record<
  NotificationType,
  (data: TemplateData) => TemplateResult
> = {
  contract_sent: contractSent,
  contract_signed: contractSigned,
  payment_received: paymentReceived,
  payment_due: paymentDue,
  booking_confirmed: bookingConfirmed,
  calendar_conflict: calendarConflict,
  agency_invite: agencyInvite,
};

function getTemplate(
  type: NotificationType,
  data: TemplateData
): TemplateResult {
  return TEMPLATE_MAP[type](data);
}

export { getTemplate, TEMPLATE_MAP };
export type { TemplateData, TemplateResult };
