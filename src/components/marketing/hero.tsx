"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { WaitlistForm } from "./waitlist-form";

type CityState =
  | { status: "pending" }
  | { status: "resolved"; city: string }
  | { status: "denied" };

interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  county?: string;
}

interface NominatimResponse {
  address?: NominatimAddress;
}

function useCityName(): CityState {
  const [state, setState] = useState<CityState>({ status: "pending" });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({ status: "denied" });
      return;
    }

    const abortController = new AbortController();

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
          const response = await fetch(url, {
            signal: abortController.signal,
            headers: { "Accept-Language": "en" },
          });
          if (!response.ok) throw new Error("Geocoding failed");
          const data = (await response.json()) as NominatimResponse;
          const city =
            data.address?.city ??
            data.address?.town ??
            data.address?.village ??
            data.address?.county;
          if (city) {
            setState({ status: "resolved", city });
          } else {
            setState({ status: "denied" });
          }
        } catch (err) {
          if (err instanceof Error && err.name === "AbortError") return;
          setState({ status: "denied" });
        }
      },
      () => setState({ status: "denied" }),
      { timeout: 8000 }
    );

    return () => abortController.abort();
  }, []);

  return state;
}

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const cityState = useCityName();

  function renderEyebrow() {
    const prefersReducedMotion =
      typeof window !== "undefined"
        ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
        : false;

    if (cityState.status === "pending") {
      return (
        <>
          Built for{" "}
          <span
            className={
              prefersReducedMotion
                ? "hero__city-placeholder hero__city-placeholder--static"
                : "hero__city-placeholder"
            }
            aria-label="locating your city"
          />
          {"\u2019s club scene"}
        </>
      );
    }
    if (cityState.status === "resolved") {
      return <>Built for {cityState.city}&rsquo;s club scene</>;
    }
    return <>Built for the club scene</>;
  }

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
        <p className="hero__animate hero__eyebrow">{renderEyebrow()}</p>
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
