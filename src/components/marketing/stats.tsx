"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface Stat {
  value: string;
  prefix: string;
  suffix: string;
  numericValue: number;
  label: string;
}

const STATS: Stat[] = [
  {
    value: "$0",
    prefix: "$",
    suffix: "",
    numericValue: 0,
    label: "Platform fees for DJs",
  },
  {
    value: "100%",
    prefix: "",
    suffix: "%",
    numericValue: 100,
    label: "Payment guarantee",
  },
  {
    value: "9",
    prefix: "",
    suffix: "",
    numericValue: 9,
    label: "Contract clause types",
  },
  {
    value: "0",
    prefix: "",
    suffix: "",
    numericValue: 0,
    label: "Gigs lost to no-shows",
  },
];

export function Stats() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const counterEls = section.querySelectorAll<HTMLElement>(".stats__value");

    if (prefersReducedMotion) {
      counterEls.forEach((el) => {
        const target = el.dataset.target;
        if (target) el.textContent = target;
      });
      return;
    }

    const ctx = gsap.context(() => {
      counterEls.forEach((el) => {
        const raw = el.dataset.numericValue;
        const prefix = el.dataset.prefix ?? "";
        const suffix = el.dataset.suffix ?? "";
        const target = parseFloat(raw ?? "0");

        if (target === 0) {
          /* For $0 and 0 — just reveal, no counting */
          gsap.fromTo(
            el,
            { opacity: 0, y: 8 },
            {
              opacity: 1,
              y: 0,
              duration: 0.6,
              ease: "power2.out",
              scrollTrigger: {
                trigger: section,
                start: "top 80%",
                once: true,
              },
            }
          );
          return;
        }

        const counter = { val: 0 };
        gsap.to(counter, {
          val: target,
          duration: 1.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: section,
            start: "top 80%",
            once: true,
          },
          onUpdate() {
            el.textContent =
              prefix + Math.round(counter.val).toString() + suffix;
          },
        });
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-20 px-6 border-t border-b border-border-primary"
    >
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-2">
              <span
                className="stats__value font-[var(--font-display)] text-5xl md:text-[3.5rem] font-semibold text-text-primary tracking-tight"
                data-target={stat.value}
                data-numeric-value={stat.numericValue}
                data-prefix={stat.prefix}
                data-suffix={stat.suffix}
              >
                {stat.value}
              </span>
              <span className="font-body text-sm text-text-secondary">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
