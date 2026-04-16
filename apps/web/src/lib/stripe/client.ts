import Stripe from "stripe";

let _stripe: Stripe | null = null;

/**
 * Lazy-initialized Stripe client. Defers the STRIPE_SECRET_KEY check
 * to first use rather than module load, so builds and tests don't
 * crash when the env var isn't set at import time.
 */
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    _stripe = new Stripe(key, {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
    });
  }
  return _stripe;
}
