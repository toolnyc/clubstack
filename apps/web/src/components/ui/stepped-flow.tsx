"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "./button";

interface Step {
  title: string;
  content: React.ReactNode;
  validate?: () => boolean;
}

interface SteppedFlowProps {
  steps: Step[];
  onComplete: () => void;
  loading?: boolean;
  className?: string;
}

function SteppedFlow({
  steps,
  onComplete,
  loading = false,
  className = "",
}: SteppedFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);

  function handleNext() {
    const step = steps[currentStep];
    if (step.validate && !step.validate()) return;

    if (currentStep === steps.length - 1) {
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  }

  function handleBack() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }

  const isLast = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className={`stepped-flow ${className}`}>
      <div className="stepped-flow__indicator">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className={`stepped-flow__step ${idx === currentStep ? "stepped-flow__step--active" : ""} ${idx < currentStep ? "stepped-flow__step--done" : ""}`}
          >
            <span className="stepped-flow__step-num">{idx + 1}</span>
            <span className="stepped-flow__step-title">{step.title}</span>
            {idx < steps.length - 1 && (
              <ChevronRight
                size={14}
                strokeWidth={1.5}
                className="stepped-flow__arrow"
              />
            )}
          </div>
        ))}
      </div>

      <div
        className="stepped-flow__progress"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="stepped-flow__progress-bar"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="stepped-flow__content">{steps[currentStep].content}</div>

      <div className="stepped-flow__actions">
        {currentStep > 0 && (
          <Button type="button" variant="ghost" onClick={handleBack}>
            Back
          </Button>
        )}
        <Button
          type="button"
          variant="primary"
          onClick={handleNext}
          loading={loading && isLast}
        >
          {isLast ? "Complete" : "Continue"}
        </Button>
      </div>
    </div>
  );
}

export { SteppedFlow };
export type { SteppedFlowProps, Step };
