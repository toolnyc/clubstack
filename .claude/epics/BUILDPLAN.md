# Build Plan: Phase 1A — Agency MVP (Batch 2)

> **Created:** 2026-04-09
> **Status:** Active
> **Approach:** Functionality-first, design pass later

## Completed (Batch 1)

- [x] dj-profile-mobile
- [x] technical-rider-mobile
- [x] agency-roster-mobile
- [x] calendar-availability
- [x] booking-workflow-mobile

## Execution Order

1. booking-costs-travel-mobile — Add/edit/remove booking cost line items and travel logistics (flights, hotels, ground transport) from the booking detail screen. Web has travel-actions.ts and travel-form.tsx as reference. API routes for costs + travel CRUD, mobile UI for managing both from booking detail.
2. booking-threads-mobile — In-booking messaging. Thread per booking, messages with sender info, system messages for status changes. Web has threads/messages schema. API routes for threads + messages, mobile chat-style UI on booking detail screen.
3. contracts-mobile — Contract builder + e-signature flow from mobile. Create contract from booking, customize clauses, preview, send for signature via existing token-gated signing page. Web has contract actions, clause-defaults, signature-actions as reference. API routes + mobile screens for contract management within a booking.
