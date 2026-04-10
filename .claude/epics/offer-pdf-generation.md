---
slug: offer-pdf-generation
created: 2026-04-10
status: completed
---

# Epic: Branded PDF Offer Generation

## Intent

Before a contract is signed, agencies need to send a professional-looking offer
to venues/promoters (fee, artist details, event info, deal terms). Today the
mobile app can create bookings and contracts but has no way to produce a
shareable PDF "offer sheet." This is the last Week 9–10 item before Phase 1B
(Payments).

Primary user: agency bookers (Amelia-type). They'll generate the PDF from a
booking detail screen and share it via the native iOS/Android share sheet
(AirDrop, email, WhatsApp, iMessage).

**Architectural rule for this feature:** `@react-pdf/renderer` is a
server-only concern. All PDF layout and rendering happens inside the Next.js
API route. Mobile never imports `@react-pdf/*`, never renders a PDF in-app,
and never edits one — it only downloads bytes and hands them to the OS share
sheet. This keeps the heavy PDF library out of the mobile and client bundles.

## Current State

- **Bookings API:** `apps/web/src/app/api/bookings/[id]/route.ts` returns a
  booking joined with artists, agency, costs, travel. Deal math lives in
  `apps/web/src/lib/booking/deal-math.ts` and is exposed via
  `apps/web/src/app/api/bookings/[id]/deal-math/route.ts`.
- **Contracts:** end-to-end on web + mobile. Pattern to mirror for auth +
  route structure: `apps/web/src/app/api/bookings/[id]/contract/route.ts`
  (uses `createClientFromRequest` + `unauthorizedResponse` from
  `@/lib/supabase/api`).
- **Mobile booking screens:** `apps/mobile/app/booking/[id].tsx`,
  `apps/mobile/app/booking/contract.tsx` — existing booking detail + contract
  screens, already fetch via Bearer token against the web API.
- **Mobile booking client:** `apps/mobile/lib/booking-types.ts` has deal-math
  types. API client helpers live alongside each screen / in `apps/mobile/lib/`.
- **PDF rendering:** `@react-pdf/renderer` is **not** currently installed in
  `apps/web/package.json`. Needs to be added as a server-only dependency.
- **Expo sharing:** `expo-sharing` + `expo-file-system` are **not** currently
  dependencies of `apps/mobile`. Need to be added.
- **Clause content** (for optional terms section): reusable defaults in
  `apps/web/src/lib/contract/clause-defaults.ts`.

## Delta — What Needs to Be Built

1. Install `@react-pdf/renderer` in `apps/web` (server-side only — must never
   be imported by a client component).
2. Install `expo-sharing` and `expo-file-system` in `apps/mobile`.
3. A reusable React PDF document component for the branded offer
   (lives in `apps/web/src/lib/pdf/`, imported only from the API route).
4. A Next.js API route that streams the rendered PDF.
5. A mobile client helper that downloads the PDF to a temp file (no PDF
   parsing, rendering, or editing on-device).
6. A "Share offer PDF" button on the mobile booking detail screen, gated on
   booking status and wired to `expo-sharing`.

## Data Model

None. No schema changes for MVP cut. (Stretch: `bookings.offer_pdf_generated_at`
timestamp — deferred, not part of this epic.)

## API Surface

**New:** `apps/web/src/app/api/bookings/[id]/offer-pdf/route.ts`

```ts
// GET /api/bookings/[id]/offer-pdf
// Returns: application/pdf, inline disposition
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response>;
```

Behavior:

- Auth via `createClientFromRequest` (same pattern as contract route)
- Loads booking + artists + agency + deal math (reuse existing queries /
  `computeDealMath` util)
- Calls `@react-pdf/renderer`'s `renderToBuffer(<OfferDocument … />)` and
  returns the buffer with
  `Content-Type: application/pdf`,
  `Content-Disposition: inline; filename="offer-<bookingId>.pdf"`
- 404 if booking not found; 401 if unauthorized; 403 if user doesn't belong
  to the booking's agency

**New lib:** `apps/web/src/lib/pdf/offer-document.tsx`

- Exports `OfferDocument` (React PDF component) — server-only, never
  imported by client code.
- Uses `@react-pdf/renderer`'s `Document`, `Page`, `View`, `Text`, `StyleSheet`.

## UI Breakdown

### Mobile

- **`apps/mobile/app/booking/[id].tsx`** (existing booking detail screen)
  - Add "Share offer PDF" button in the actions section, visible only when
    `booking.status` is `draft` or `contract_sent`.
  - On tap: call the download helper, then `Sharing.shareAsync(uri)`.
  - Loading + error states (spinner in button, alert on failure).
- **`apps/mobile/lib/offer-pdf.ts`** (new)
  - `downloadOfferPdf(bookingId: string, token: string): Promise<string>`
  - Fetches `/api/bookings/:id/offer-pdf` with Bearer token, writes the
    response to a temp file via `expo-file-system`, returns the file URI.
  - Does NOT render, parse, or modify the PDF.

### Web

- No web UI changes. The API route is the only web-side surface.

## Acceptance Criteria

1. From the mobile booking detail screen, with a booking in status `draft` or
   `offered`, tapping "Share offer PDF" opens the native share sheet with a
   valid PDF file.
2. The PDF includes:
   - Agency name as header
   - Artist name(s) and fee(s)
   - Event name, date, venue/promoter, city
   - Deal math table: gross fee, commission, costs, net to artist
   - Signature lines for agency and counterparty
3. `GET /api/bookings/:id/offer-pdf` returns HTTP 200 with
   `Content-Type: application/pdf` when called with a valid agency member's
   Bearer token.
4. `GET /api/bookings/:id/offer-pdf` returns 401 when unauthenticated and 403
   when the authenticated user does not belong to the booking's agency.
5. The "Share offer PDF" button is hidden when booking status is `signed`,
   `paid`, `completed`, or `cancelled`.
6. `pnpm build` in `apps/web` and `pnpm --filter mobile lint` both pass.
7. `@react-pdf/renderer` does not appear in any client bundle — grep confirms
   it's imported only from `apps/web/src/app/api/**` and `apps/web/src/lib/pdf/**`.
8. Architecture test still passes (no new `@supabase/*` imports outside
   `lib/supabase/`).

## Known Risks

- **Client-bundle leak:** `@react-pdf/renderer` is heavy. Must be imported
  only from the route handler / server-only lib. Any accidental client import
  blows up the bundle. Enforced by acceptance criterion #7.
- **Buffer vs stream:** `renderToBuffer` is simpler than `renderToStream` and
  fine for small offer PDFs — use it.
- **Expo sharing availability:** `expo-sharing` requires
  `Sharing.isAvailableAsync()` check before calling — guard against
  unsupported platforms.
- **Deal math shape mismatch:** make sure the shape returned by
  `computeDealMath` matches what `OfferDocument` expects. Add a narrow
  mapper if needed.
- **Fonts:** `@react-pdf/renderer` ships with Helvetica by default. Custom
  brand fonts require `Font.register` with a URL — defer to a follow-up if
  we want the real Clubstack typeface.
