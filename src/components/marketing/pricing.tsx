import { Button } from "@/components/ui/button";

interface Tier {
  name: string;
  price: string;
  interval: string;
  description: string;
  features: string[];
  cta: string;
  highlighted: boolean;
}

const TIERS: Tier[] = [
  {
    name: "Starter",
    price: "$299",
    interval: "/mo",
    description: "For independent venues getting started with online booking.",
    features: [
      "Up to 20 bookings/mo",
      "DJ search & discovery",
      "Contract templates",
      "Basic reporting",
      "Email support",
    ],
    cta: "Start free trial",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$499",
    interval: "/mo",
    description: "For active venues that book multiple nights per week.",
    features: [
      "Unlimited bookings",
      "DJ search & discovery",
      "Custom contract builder",
      "Escrow payments",
      "Advanced analytics",
      "Priority support",
      "Multi-room management",
    ],
    cta: "Start free trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "$799",
    interval: "/mo",
    description: "For venue groups and promoters managing multiple locations.",
    features: [
      "Everything in Pro",
      "Multi-venue dashboard",
      "Agency integrations",
      "Dedicated account manager",
      "Custom onboarding",
      "API access",
      "SLA guarantee",
    ],
    cta: "Contact sales",
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-[1200px] mx-auto">
        <p className="font-mono text-sm text-accent-cyan uppercase tracking-wider text-center mb-2">
          For venues
        </p>
        <h2 className="font-[var(--font-display)] text-3xl font-semibold text-text-primary text-center mb-4">
          Simple pricing, no booking fees
        </h2>
        <p className="font-body text-base text-text-secondary text-center max-w-2xl mx-auto mb-12">
          Accessible pricing for DJs. Venues pay a flat monthly rate &mdash; no
          percentage of bookings, no hidden fees.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`pricing__card flex flex-col p-6 rounded-lg border bg-bg-secondary ${
                tier.highlighted
                  ? "border-accent-cyan"
                  : "border-border-primary"
              }`}
            >
              <div className="flex flex-col gap-3 mb-6">
                <h3 className="font-[var(--font-display)] text-xl font-semibold text-text-primary">
                  {tier.name}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="font-[var(--font-display)] text-4xl font-semibold text-text-primary">
                    {tier.price}
                  </span>
                  <span className="font-body text-sm text-text-secondary">
                    {tier.interval}
                  </span>
                </div>
                <p className="font-body text-sm text-text-secondary">
                  {tier.description}
                </p>
              </div>
              <ul className="flex flex-col gap-3 mb-6 flex-1">
                {tier.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2 font-body text-sm text-text-primary"
                  >
                    <svg
                      className="w-4 h-4 text-accent-cyan flex-shrink-0"
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M13.25 4.75L6 12L2.75 8.75"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                variant={tier.highlighted ? "primary" : "secondary"}
                size="lg"
                className="w-full"
              >
                {tier.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
