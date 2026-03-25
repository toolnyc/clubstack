"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface Feature {
  label: string;
  description: string;
}

interface UserType {
  role: string;
  heading: string;
  sub: string;
  features: Feature[];
  comingSoon?: boolean;
}

const USER_TYPES: UserType[] = [
  {
    role: "For DJs",
    heading: "Manage the operational side of getting booked.",
    sub: "Accessible pricing for working DJs.",
    features: [
      {
        label: "Availability",
        description:
          "Sync with Google Calendar. Set holds, confirm dates, block time off.",
      },
      {
        label: "Contracts",
        description:
          "Generate and sign before every gig. E-signatures, customizable terms, full paper trail.",
      },
      {
        label: "Invoicing",
        description: "Send invoices automatically after each booking.",
      },
      {
        label: "Guaranteed payment",
        description:
          "Funds held in escrow, released on completion. No cash, no follow-up texts.",
      },
      {
        label: "Public profile",
        description: "Availability, bio, mixes, rider — one link.",
      },
    ],
  },
  {
    role: "For Promoters",
    heading: "Booking management across your events.",
    sub: "Offers, confirmations, payments, and budget in one place.",
    features: [
      {
        label: "Browse DJs",
        description: "Filter by availability, genre, location. Live data.",
      },
      {
        label: "Offers",
        description:
          "Send and track booking offers. Manage holds and confirmations.",
      },
      {
        label: "Budget",
        description: "Total fees committed per event and across your schedule.",
      },
      {
        label: "Payments",
        description:
          "Pay DJs through the platform. Every transaction documented.",
      },
    ],
  },
  {
    role: "For Agencies",
    heading: "Roster and booking coordination across multiple artists.",
    sub: "",
    features: [
      {
        label: "Roster dashboard",
        description:
          "All your artists, their availability, their upcoming schedule.",
      },
      {
        label: "Availability grid",
        description: "Full roster calendar in a single view.",
      },
      {
        label: "Booking coordination",
        description:
          "Field offers, confirm dates, manage holds on behalf of your artists.",
      },
      {
        label: "Artist profiles",
        description: "Each artist gets a public profile linked to your agency.",
      },
    ],
  },
  {
    role: "For Venues",
    heading: "Venue tools are in development.",
    sub: "Direct booking, compliance documentation, and a connection to New York's DJ network. Get on the list for early access.",
    features: [],
    comingSoon: true,
  },
];

export function UserTypes() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      gsap.set(section.querySelectorAll(".user-type"), { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".user-type",
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
          stagger: 0.15,
          scrollTrigger: {
            trigger: section,
            start: "top 75%",
            once: true,
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-20 px-6 border-t border-b border-border-primary"
    >
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
        {USER_TYPES.map((type) => (
          <div
            key={type.role}
            className={`user-type flex flex-col gap-4 p-6 rounded-lg border border-border-primary bg-bg-secondary transition-colors duration-200 ${
              type.comingSoon ? "opacity-60" : ""
            }`}
          >
            <div className="flex flex-col gap-1">
              <span className="font-mono text-sm text-accent-cyan uppercase tracking-wider">
                {type.role}
              </span>
              <h2 className="font-[var(--font-display)] text-2xl font-semibold text-text-primary leading-tight">
                {type.heading}
              </h2>
              {type.sub && (
                <p className="font-body text-sm text-text-secondary">
                  {type.sub}
                </p>
              )}
            </div>
            {type.features.length > 0 && (
              <ul
                className="flex flex-col gap-3 mt-2"
                aria-label={`${type.role} features`}
              >
                {type.features.map((f) => (
                  <li key={f.label} className="flex flex-col gap-0.5">
                    <span className="font-mono text-sm text-text-primary font-medium">
                      {f.label}
                    </span>
                    <span className="font-body text-sm text-text-secondary">
                      {f.description}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
