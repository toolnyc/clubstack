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
    sub: "Free forever.",
    features: [
      {
        label: "Availability",
        description:
          "Sync with Google Calendar. Set holds, confirm dates, block time off.",
      },
      {
        label: "Contracts",
        description:
          "Generate and sign before every gig. 9 clause types, e-signatures, paper trail.",
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
    <section ref={sectionRef} className="user-types">
      <div className="user-types__container">
        {USER_TYPES.map((type) => (
          <div
            key={type.role}
            className={`user-type${type.comingSoon ? " user-type--coming-soon" : ""}`}
          >
            <div className="user-type__header">
              <span className="user-type__role">{type.role}</span>
              <h2 className="user-type__heading">{type.heading}</h2>
              {type.sub && <p className="user-type__sub">{type.sub}</p>}
            </div>
            {type.features.length > 0 && (
              <ul
                className="user-type__features"
                aria-label={`${type.role} features`}
              >
                {type.features.map((f) => (
                  <li key={f.label} className="user-type__feature">
                    <span className="user-type__feature-label">{f.label}</span>
                    <span className="user-type__feature-desc">
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
