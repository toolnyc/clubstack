import type { Resend } from "resend";
import type { NotificationType } from "@/types";
import { getTemplate } from "./templates";
import type { TemplateData } from "./templates";
import { createClient } from "@/lib/supabase/server";

let resendClient: Resend | null = null;

function getResend(): Resend {
  if (resendClient) return resendClient;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Resend } = require("resend") as typeof import("resend");
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }
  resendClient = new Resend(apiKey);
  return resendClient;
}

const FROM_ADDRESS = "Clubstack <notifications@clubstack.studio>";

interface SendNotificationResult {
  sent: boolean;
  error: string | null;
}

async function isEmailEnabled(
  userId: string,
  type: NotificationType
): Promise<boolean> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("notification_preferences")
    .select("email_enabled")
    .eq("user_id", userId)
    .eq("notification_type", type)
    .single();

  // Default to enabled if no preference row exists
  if (!data) return true;
  return data.email_enabled;
}

async function sendNotification(
  type: NotificationType,
  recipientEmail: string,
  data: TemplateData,
  userId?: string
): Promise<SendNotificationResult> {
  // Check preferences if userId is provided
  if (userId) {
    const enabled = await isEmailEnabled(userId, type);
    if (!enabled) {
      return { sent: false, error: null };
    }
  }

  const { subject, html } = getTemplate(type, data);

  try {
    const resend = getResend();
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: recipientEmail,
      subject,
      html,
    });
    return { sent: true, error: null };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown error sending email";
    return { sent: false, error: message };
  }
}

export { sendNotification, isEmailEnabled };
export type { SendNotificationResult };
