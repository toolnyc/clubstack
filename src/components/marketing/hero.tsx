"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { WaitlistForm } from "./waitlist-form";

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
          Built for New York&apos;s club scene
        </p>
        <h1 className="hero__animate hero__headline">Clubstack</h1>
        <p className="hero__animate hero__subtitle">
          Booking management, contracts, calendar sync, and guaranteed payment.
          Tools for working DJs, promoters, and agencies.
        </p>
        <div className="hero__animate hero__form-wrapper">
          <WaitlistForm />
        </div>
      </div>
    </section>
  );
}
