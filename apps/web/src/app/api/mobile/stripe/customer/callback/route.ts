import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/mobile/stripe/customer/callback
 * Stripe Checkout redirects here after payment method setup.
 * Shows a simple HTML page for the mobile in-app browser.
 */
export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status");
  const isSuccess = status === "success";

  const html = `<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#000;color:#fff}
.card{text-align:center;padding:2rem}h1{font-size:1.5rem;margin-bottom:0.5rem}</style></head>
<body><div class="card">
<h1>${isSuccess ? "Payment method saved" : "Setup cancelled"}</h1>
<p>${isSuccess ? "You can close this window and return to the app." : "No payment method was saved. Close this window to go back."}</p>
</div></body></html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
