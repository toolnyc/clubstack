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
    icon: <Calendar size={24} strokeWidth={1.5} />,
    title: "Calendar sync",
    description:
      "Connect Google Calendar. Your availability updates in real time — no double-bookings, no back-and-forth.",
  },
  {
    icon: <FileText size={24} strokeWidth={1.5} />,
    title: "Contract builder",
    description:
      "Generate contracts with e-signatures and a full paper trail. Every gig documented before you show up.",
  },
  {
    icon: <ShieldCheck size={24} strokeWidth={1.5} />,
    title: "Guaranteed payment",
    description:
      "Funds held in escrow and released automatically. No more chasing promoters at 2am.",
  },
  {
    icon: <LayoutDashboard size={24} strokeWidth={1.5} />,
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
    <section ref={sectionRef} className="py-20 px-6">
      <div className="max-w-[1200px] mx-auto">
        <h2 className="font-[var(--font-display)] text-3xl font-semibold text-text-primary text-center mb-12">
          Everything you need to get booked and get paid
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="features__card flex flex-col gap-3 p-4"
            >
              <span className="w-10 h-10 text-accent-cyan" aria-hidden="true">
                {feature.icon}
              </span>
              <h3 className="font-[var(--font-display)] text-lg font-semibold text-text-primary">
                {feature.title}
              </h3>
              <p className="font-body text-sm text-text-secondary leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
