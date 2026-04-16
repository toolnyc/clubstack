import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/mobile/stripe/connect/callback
 * Stripe redirects here after onboarding completes or the link expires.
 * Returns a simple HTML page the mobile in-app browser can display
 * before the user dismisses it. The mobile app polls /status on return.
 */
export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status");
  const isComplete = status === "complete";

  const html = `<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#000;color:#fff}
.card{text-align:center;padding:2rem}h1{font-size:1.5rem;margin-bottom:0.5rem}</style></head>
<body><div class="card">
<h1>${isComplete ? "Setup complete" : "Link expired"}</h1>
<p>${isComplete ? "You can close this window and return to the app." : "Please close this window and try again."}</p>
</div></body></html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
