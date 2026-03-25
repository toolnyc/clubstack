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
    <section className="pricing">
      <div className="pricing__container">
        <p className="pricing__eyebrow">For venues</p>
        <h2 className="pricing__heading">Simple pricing, no booking fees</h2>
        <p className="pricing__subheading">
          Accessible pricing for DJs. Venues pay a flat monthly rate &mdash; no
          percentage of bookings, no hidden fees.
        </p>
        <div className="pricing__grid">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`pricing__card ${
                tier.highlighted ? "pricing__card--highlighted" : ""
              }`}
            >
              <div className="pricing__card-header">
                <h3 className="pricing__tier-name">{tier.name}</h3>
                <div className="pricing__price">
                  <span className="pricing__amount">{tier.price}</span>
                  <span className="pricing__interval">{tier.interval}</span>
                </div>
                <p className="pricing__tier-description">{tier.description}</p>
              </div>
              <ul className="pricing__feature-list">
                {tier.features.map((feature) => (
                  <li key={feature} className="pricing__feature-item">
                    <svg
                      className="pricing__check-icon"
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
                className="pricing__cta"
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
