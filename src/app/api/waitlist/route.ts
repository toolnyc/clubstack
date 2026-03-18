import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ROLE_HEADLINES: Record<string, string> = {
  dj: "Your spot's reserved.",
  promoter: "You're in.",
  agency: "You're in.",
  venue: "Early access confirmed.",
};

const ROLE_BODY: Record<string, string> = {
  dj: "We're building the toolkit working DJs actually need — guaranteed payment, contracts, calendar sync, and clean invoicing. New York launches first. We'll reach out when your access is ready.",
  promoter:
    "Clubstack gives promoters a real booking workflow — browse available DJs, send offers, manage payments, track budget. We're rolling out in New York first and you're on the list.",
  agency:
    "Roster management, availability grid, booking coordination across all your artists. New York launches first — we'll be in touch.",
  venue:
    "Direct booking, compliance documentation, and a connection to New York's DJ network. You're on the early access list for venue tools.",
};

const SHOW_FEATURES = new Set(["dj", "promoter"]);

function buildConfirmationEmail(role: string, name?: string): string {
  const headline = ROLE_HEADLINES[role] ?? "You're on the list.";
  const body =
    ROLE_BODY[role] ??
    "We're onboarding in New York first. We'll reach out when we're ready to bring you on.";
  const showFeatures = SHOW_FEATURES.has(role);
  const firstName = name?.split(" ")[0];

  const featuresBlock = showFeatures
    ? `
    <div style="border-left:2px solid #d3f707;padding-left:16px;margin:24px 0;">
      <p style="margin:0 0 6px;font-size:13px;color:#a0a0a0;line-height:1.6;">Guaranteed payment via escrow</p>
      <p style="margin:0 0 6px;font-size:13px;color:#a0a0a0;line-height:1.6;">Contracts with e-signatures</p>
      <p style="margin:0;font-size:13px;color:#a0a0a0;line-height:1.6;">Calendar sync &amp; availability</p>
    </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#0c0b0a;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#0c0b0a;">
    <tr>
      <td align="center" style="padding:48px 40px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;">
          <tr>
            <td style="padding-bottom:32px;border-bottom:1px solid #1e1e1e;">
              <span style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;font-weight:600;color:#d3f707;letter-spacing:0.1em;text-transform:uppercase;">CLUBSTACK</span>
            </td>
          </tr>
          <tr>
            <td style="padding-top:32px;">
              ${firstName ? `<p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#a0a0a0;margin:0 0 12px;">Hey ${firstName},</p>` : ""}
              <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:24px;font-weight:600;color:#f0f0f0;margin:0 0 16px;letter-spacing:-0.02em;line-height:1.3;">${headline}</p>
              <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#a0a0a0;line-height:1.7;margin:0 0 24px;">${body}</p>
              ${featuresBlock}
              <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#555555;margin:24px 0 0;">— The Clubstack team</p>
              <div style="margin-top:40px;padding-top:16px;border-top:1px solid #1a1a1a;">
                <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#444444;margin:0;line-height:1.6;">You received this because you signed up at clubstack.studio</p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendConfirmationEmail(
  email: string,
  role: string,
  name?: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);

  const firstName = name ? name.split(" ")[0] : undefined;
  const subject = firstName
    ? `Hey ${firstName}, you're on the Clubstack waitlist`
    : "You're on the Clubstack waitlist";

  await resend.emails.send({
    from: "Clubstack <notifications@clubstack.studio>",
    to: email,
    subject,
    html: buildConfirmationEmail(role, name),
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

  const { email, role, name } = body as {
    email?: string;
    role?: string;
    name?: string;
  };

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

  const normalizedName =
    name && typeof name === "string" ? name.trim() : undefined;

  const supabase = await createClient();
  const insertData: Record<string, string> = {
    email: normalizedEmail,
    role,
  };
  if (normalizedName) insertData.name = normalizedName;

  const { error } = await supabase.from("waitlist_signups").insert(insertData);

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

  try {
    await sendConfirmationEmail(normalizedEmail, role, normalizedName);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Waitlist confirmation email error:", message, {
      email: normalizedEmail,
      role,
    });
  }

  return NextResponse.json({ success: true });
}
