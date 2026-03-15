"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { Button } from "@/components/ui/button";

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      gsap.set(section.querySelectorAll(".hero__animate"), {
        opacity: 1,
        filter: "blur(0px)",
        y: 0,
      });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".hero__animate",
        { opacity: 0, filter: "blur(4px)", y: 12 },
        {
          opacity: 1,
          filter: "blur(0px)",
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          stagger: 0.12,
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="hero">
      <div className="hero__container">
        <p className="hero__animate hero__eyebrow">
          The booking platform for underground music
        </p>
        <h1 className="hero__animate hero__headline">DJs keep 100%</h1>
        <p className="hero__animate hero__subtitle">
          Guaranteed payment. No platform fees. Calendar sync, contracts, and
          escrow &mdash; so you get paid every time.
        </p>
        <div className="hero__animate hero__actions">
          <Button variant="primary" size="lg">
            Get started &mdash; free
          </Button>
          <Button variant="secondary" size="lg">
            For venues
          </Button>
        </div>
      </div>
    </section>
  );
}
