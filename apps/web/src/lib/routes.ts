/**
 * All app routes referenced in navigation and links.
 * Used by both the app and route smoke tests.
 */

/** Routes shown in sidebar and bottom tabs */
export const NAV_ROUTES = [
  "/dashboard",
  "/calendar",
  "/bookings",
  "/invoices",
  "/roster",
] as const;

/** Routes linked from various pages */
export const APP_ROUTES = [
  ...NAV_ROUTES,
  "/settings",
  "/profile",
  "/profile/edit",
  "/roster/availability",
  "/earnings",
  "/onboarding",
] as const;

/** Routes that require a dynamic segment (can't smoke test without data) */
export const DYNAMIC_ROUTES = [
  "/bookings/new",
  "/bookings/[id]",
  "/bookings/[id]/itinerary",
  "/dj/[slug]",
  "/sign/[token]",
] as const;
