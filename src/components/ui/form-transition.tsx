"use client";

import { useLayoutEffect, useEffect, useRef, useState } from "react";
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
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  // When transitioning: render frozenChildren (the outgoing content).
  // When idle: render children directly so live form state (typing, etc.) flows through.
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [frozenChildren, setFrozenChildren] = useState<React.ReactNode>(null);

  const prevKeyRef = useRef(stateKey);
  const isTransitioningRef = useRef(false);

  // Snapshot of what was last rendered while idle — becomes the "outgoing" content
  // for the next transition. Updated every commit while not mid-transition.
  const committedChildrenRef = useRef<React.ReactNode>(children);

  // Always-current children for use inside effects without adding children to deps.
  // Updated inside useLayoutEffect (not during render) to satisfy the no-ref-in-render rule.
  const incomingChildrenRef = useRef<React.ReactNode>(children);

  useLayoutEffect(() => {
    // Keep incomingChildrenRef current so the animation effect can read it without
    // needing children in its dependency array (which would restart mid-flight).
    incomingChildrenRef.current = children;

    // Detect a stateKey change before the animation effect fires.
    if (stateKey !== prevKeyRef.current && !isTransitioningRef.current) {
      // committedChildrenRef.current still holds children from the PREVIOUS render
      // (updated below only when idle), so this is the correct outgoing content.
      setFrozenChildren(committedChildrenRef.current);
      setIsTransitioning(true);
      isTransitioningRef.current = true;
      prevKeyRef.current = stateKey;
    }

    // Keep the snapshot current while idle so the next transition has fresh content.
    if (!isTransitioningRef.current) {
      committedChildrenRef.current = children;
    }
  }, [stateKey, children]);

  useEffect(() => {
    if (!isTransitioning) return;

    const container = containerRef.current;
    if (!container) return;

    tweenRef.current?.kill();

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Snapshot incoming children at effect time (correct snapshot for this transition).
    const incoming = incomingChildrenRef.current;

    if (prefersReducedMotion) {
      tweenRef.current = gsap.to(container, {
        duration: 0,
        onComplete: () => {
          setFrozenChildren(incoming);
          committedChildrenRef.current = incoming;
          isTransitioningRef.current = false;
          setIsTransitioning(false);
        },
      });
      return () => {
        tweenRef.current?.kill();
      };
    }

    // Animate out → swap content → animate in.
    tweenRef.current = gsap.to(container, {
      opacity: 0,
      filter: "blur(4px)",
      y: -8,
      duration: 0.25,
      ease: "power2.in",
      onComplete: () => {
        setFrozenChildren(incoming);
        tweenRef.current = gsap.fromTo(
          container,
          { opacity: 0, filter: "blur(4px)", y: 12 },
          {
            opacity: 1,
            filter: "blur(0px)",
            y: 0,
            duration: 0.5,
            ease: "power2.out",
            onComplete: () => {
              committedChildrenRef.current = incoming;
              isTransitioningRef.current = false;
              setIsTransitioning(false);
            },
          }
        );
      },
    });

    return () => {
      tweenRef.current?.kill();
    };
  }, [isTransitioning]);

  return (
    <div ref={containerRef} className={className}>
      {isTransitioning ? frozenChildren : children}
    </div>
  );
}
