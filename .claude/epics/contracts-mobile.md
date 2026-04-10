---
slug: contracts-mobile
created: 2026-04-09
status: draft
---

# Epic: Contracts — Mobile

## Intent

Allow agency users to create, customize, and send contracts from the mobile app within a booking context. Contracts can be previewed, clause-toggled, and sent for signature via the existing token-gated web signing page. This brings the web contract builder workflow to mobile.

## Current State

- **DB schema exists:** `contracts` (id, booking_id unique, status, signature_config, signing_token), `contract_clauses` (id, contract_id, clause_type, title, content, is_enabled, sort_order), `contract_signatures` (id, contract_id, signer_role, signer_name, signer_email, signature_data, signature_type, ip_address, user_agent, signed_at, token_hash, clause_snapshot)
- **RLS policies exist:** booking creator can CRUD contracts/clauses; signatures are service-role insert only
- **Shared types exist:** `Contract`, `ContractClause`, `ContractSignature`, `ContractStatus`, `SignatureConfig`, `ClauseType`, `SignerRole` in `packages/shared/src/types.ts`
- **Web server actions:** `lib/contract/actions.ts` — `createContract`, `getContract`, `getContractByBooking`, `toggleClause`, `updateClauseContent`, `reorderClauses`, `updateSignatureConfig`, `sendContractEmail`
- **Web server actions:** `lib/contract/signature-actions.ts` — `signContract`, `getSignatures`, `getContractByToken`
- **Clause defaults:** `lib/contract/clause-defaults.ts` — 9 default clause types with titles and content
- **Web components:** `components/contract/contract-builder.tsx` (split-view editor), `clause-list.tsx` (drag reorder + toggle), `contract-preview.tsx` (read-only), `signature-pad.tsx` (typed/drawn)
- **Web signing page:** `app/sign/[token]/page.tsx` — public, token-gated, renders preview + signature pad
- **Mobile booking detail:** `apps/mobile/app/booking/[id].tsx` — has costs, travel, messages, deal math, but no contract section
- **No mobile API routes, screens, or API client functions for contracts**

## Delta — What Needs to Be Built

### API Routes (Next.js)

1. `GET /api/bookings/[id]/contract` — get contract with clauses for a booking (or null if none)
2. `POST /api/bookings/[id]/contract` — create contract with default clauses
3. `PATCH /api/bookings/[id]/contract/clauses/[clauseId]` — toggle enabled or update content
4. `POST /api/bookings/[id]/contract/send` — mark contract as sent (updates status, returns signing URL)

### Mobile API Client

5. Add to `apps/mobile/lib/api.ts`:
   - `getContract(bookingId)` — fetches contract + clauses
   - `createContract(bookingId)` — creates draft with defaults
   - `toggleClause(bookingId, clauseId, enabled)` — enable/disable
   - `updateClauseContent(bookingId, clauseId, content)` — edit clause text
   - `sendContract(bookingId)` — send for signature

### Mobile UI

6. Contract screen at `apps/mobile/app/booking/contract.tsx`:
   - If no contract: "Create Contract" button
   - If draft: clause list with toggles + editable content, signature config picker, "Send for Signature" button
   - If sent/signed: read-only preview with status
   - Share signing link via native share sheet

7. "Contract" row on booking detail screen linking to contract screen

### Components

8. `apps/mobile/components/contract/clause-row.tsx` — single clause with toggle, expandable content editor
9. `apps/mobile/components/contract/contract-status-badge.tsx` — draft/sent/signed/voided badge

## Data Model

None — tables and RLS already exist.

## API Surface

```typescript
// GET /api/bookings/[id]/contract
// Response: { data: { contract: Contract; clauses: ContractClause[] } | null }

// POST /api/bookings/[id]/contract
// Response: { data: { contract: Contract; clauses: ContractClause[] } }

// PATCH /api/bookings/[id]/contract/clauses/[clauseId]
// Body: { is_enabled?: boolean; content?: string }
// Response: { data: ContractClause }

// POST /api/bookings/[id]/contract/send
// Response: { data: { signingUrl: string } }
```

## UI Breakdown

### Booking Detail (`apps/mobile/app/booking/[id].tsx`)

- Add "Contract" row between Messages and Deal Math
- Shows contract status badge (draft/sent/signed) or "Not created"
- Navigates to contract screen

### Contract Screen (`apps/mobile/app/booking/contract.tsx`)

- **No contract state:** centered "Create Contract" button
- **Draft state:**
  - Signature config picker (Agency Only / Agency + Artist)
  - Clause list (ScrollView):
    - Each clause: toggle switch, title, expandable content (TextInput)
  - Bottom bar: "Preview" and "Send for Signature" buttons
- **Sent/Signed state:**
  - Status badge
  - Read-only clause list (enabled clauses only)
  - "Signed" confirmation (signed)
  - "Share Signing Link" button (sent)

## Acceptance Criteria

1. Tapping "Contract" on booking detail navigates to the contract screen
2. User can create a contract from a booking (populates default clauses)
3. User can toggle clauses on/off; changes persist
4. User can edit clause content; changes persist on blur
5. User can switch signature config between "Agency Only" and "Agency + Artist"
6. User can send contract for signature; status updates to "sent"
7. Signing URL is shareable via native share sheet
8. Sent/signed contracts display as read-only
9. Contract status is visible on booking detail screen

## Known Risks

- Clause reordering is complex on mobile (drag-and-drop); omitting for v1 — clauses display in default sort_order
- Signing happens on the web via token-gated page, not natively — acceptable for v1
- Signature config update needs its own API route or can piggyback on contract PATCH
