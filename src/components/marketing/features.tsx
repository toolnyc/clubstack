"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Calendar, FileText, ShieldCheck, LayoutDashboard } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: <Calendar className="features__icon" aria-hidden="true" />,
    title: "Calendar sync",
    description:
      "Connect Google Calendar. Your availability updates in real time — no double-bookings, no back-and-forth.",
  },
  {
    icon: <FileText className="features__icon" aria-hidden="true" />,
    title: "Contract builder",
    description:
      "9 clause types, e-signatures, and a paper trail. Every gig documented before you show up.",
  },
  {
    icon: <ShieldCheck className="features__icon" aria-hidden="true" />,
    title: "Guaranteed payment",
    description:
      "Funds held in escrow and released automatically. No more chasing promoters at 2am.",
  },
  {
    icon: <LayoutDashboard className="features__icon" aria-hidden="true" />,
    title: "One dashboard",
    description:
      "Bookings, invoices, availability, and contacts in one place. Built for DJs, not accountants.",
  },
];

export function Features() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      gsap.set(section.querySelectorAll(".features__card"), {
        opacity: 1,
        filter: "blur(0px)",
        y: 0,
      });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".features__card",
        { opacity: 0, filter: "blur(4px)", y: 12 },
        {
          opacity: 1,
          filter: "blur(0px)",
          y: 0,
          duration: 0.6,
          ease: "power2.out",
          stagger: 0.12,
          scrollTrigger: {
            trigger: section,
            start: "top 80%",
            once: true,
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="features">
      <div className="features__container">
        <h2 className="features__heading">
          Everything you need to get booked and get paid
        </h2>
        <div className="features__grid">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="features__card">
              {feature.icon}
              <h3 className="features__title">{feature.title}</h3>
              <p className="features__description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
