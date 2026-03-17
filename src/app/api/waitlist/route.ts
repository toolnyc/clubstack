import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ROLE_LABELS: Record<string, string> = {
  dj: "DJ",
  promoter: "Promoter",
  agency: "Agency",
  venue: "Venue",
};

function buildConfirmationEmail(role: string): string {
  const roleLabel = ROLE_LABELS[role] ?? role;
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:40px 16px;font-family:system-ui,-apple-system,sans-serif;background:#0a0a0a;color:#e5e5e5;">
  <div style="max-width:520px;margin:0 auto;">
    <div style="font-size:13px;font-weight:500;color:#d3f707;letter-spacing:0.04em;text-transform:uppercase;margin-bottom:32px;">Clubstack</div>
    <p style="font-size:22px;font-weight:500;color:#f0f0f0;margin:0 0 16px;letter-spacing:-0.02em;">You're on the list.</p>
    <p style="font-size:14px;color:#a0a0a0;line-height:1.7;margin:0 0 24px;">
      We're onboarding ${roleLabel}s in New York first. We'll reach out when we're ready to bring you on.
    </p>
    <p style="font-size:14px;color:#a0a0a0;margin:0;">— The Clubstack team</p>
    <div style="margin-top:40px;padding-top:16px;border-top:1px solid #1e1e1e;font-size:12px;color:#555;">
      You received this because you signed up for the Clubstack waitlist.
    </div>
  </div>
</body>
</html>`;
}

async function sendConfirmationEmail(
  email: string,
  role: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);

  await resend.emails.send({
    from: "Clubstack <notifications@clubstack.studio>",
    to: email,
    subject: "You're on the Clubstack waitlist",
    html: buildConfirmationEmail(role),
  });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { email, role } = body as { email?: string; role?: string };

  if (
    !email ||
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return NextResponse.json(
      { error: "Valid email is required" },
      { status: 400 }
    );
  }

  const validRoles = ["dj", "promoter", "agency", "venue"] as const;
  if (!role || !validRoles.includes(role as (typeof validRoles)[number])) {
    return NextResponse.json(
      { error: "Valid role is required" },
      { status: 400 }
    );
  }

  const normalizedEmail = email.toLowerCase().trim();

  const supabase = await createClient();
  const { error } = await supabase
    .from("waitlist_signups")
    .insert({ email: normalizedEmail, role });

  if (error) {
    // Duplicate — treat as success, don't reveal if email is already registered
    if (error.code === "23505") {
      return NextResponse.json({ success: true });
    }
    console.error("Waitlist insert error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }

  // Best-effort confirmation email — don't fail the request if this errors
  sendConfirmationEmail(normalizedEmail, role).catch((err) => {
    console.error("Waitlist confirmation email error:", err);
  });

  return NextResponse.json({ success: true });
}
