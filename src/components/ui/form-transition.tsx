"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";

interface FormTransitionProps {
  /**
   * Changing this key triggers the blur-reveal transition.
   * Content sharing the same key transitions inline (no animation).
   * Example: use "form" for all form states, "success" for the success state.
   */
  stateKey: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Animates between named form states using the existing blur-reveal style
 * (opacity + blur(4px) + translateY). Matches the hero section entrance.
 *
 * Usage:
 *   <FormTransition stateKey={submitted ? "success" : "form"}>
 *     {submitted ? <SuccessMessage /> : <TheForm />}
 *   </FormTransition>
 */
export function FormTransition({
  stateKey,
  children,
  className,
}: FormTransitionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Track what is currently rendered in the DOM
  const [visibleChildren, setVisibleChildren] = useState(children);
  const prevKeyRef = useRef(stateKey);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    if (stateKey === prevKeyRef.current) return;
    prevKeyRef.current = stateKey;

    const container = containerRef.current;
    // If somehow container is not mounted, bail — nothing to animate
    if (!container) return;

    tweenRef.current?.kill();

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      // 0-duration tween: onComplete fires async, satisfying the no-sync-setState rule
      tweenRef.current = gsap.to(container, {
        duration: 0,
        onComplete: () => setVisibleChildren(children),
      });
      return () => {
        tweenRef.current?.kill();
      };
    }

    // Animate out, then swap content, then animate in.
    // children is captured in this closure — it matches stateKey at effect time.
    tweenRef.current = gsap.to(container, {
      opacity: 0,
      filter: "blur(4px)",
      y: -8,
      duration: 0.25,
      ease: "power2.in",
      onComplete: () => {
        setVisibleChildren(children);
        tweenRef.current = gsap.fromTo(
          container,
          { opacity: 0, filter: "blur(4px)", y: 12 },
          {
            opacity: 1,
            filter: "blur(0px)",
            y: 0,
            duration: 0.5,
            ease: "power2.out",
          }
        );
      },
    });

    return () => {
      tweenRef.current?.kill();
    };
  }, [stateKey, children]);

  return (
    <div ref={containerRef} className={className}>
      {visibleChildren}
    </div>
  );
}
