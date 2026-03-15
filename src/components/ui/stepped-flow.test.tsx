import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { SteppedFlow } from "./stepped-flow";

const steps = [
  { title: "Step 1", content: <p>First step</p> },
  { title: "Step 2", content: <p>Second step</p> },
  { title: "Step 3", content: <p>Third step</p> },
];

describe("SteppedFlow", () => {
  it("renders first step content", () => {
    render(<SteppedFlow steps={steps} onComplete={vi.fn()} />);
    expect(screen.getByText("First step")).toBeInTheDocument();
  });

  it("renders step indicators", () => {
    render(<SteppedFlow steps={steps} onComplete={vi.fn()} />);
    expect(screen.getByText("Step 1")).toBeInTheDocument();
    expect(screen.getByText("Step 2")).toBeInTheDocument();
    expect(screen.getByText("Step 3")).toBeInTheDocument();
  });

  it("advances to next step on Continue", async () => {
    const user = userEvent.setup();
    render(<SteppedFlow steps={steps} onComplete={vi.fn()} />);
    await user.click(screen.getByText("Continue"));
    expect(screen.getByText("Second step")).toBeInTheDocument();
  });

  it("goes back on Back button", async () => {
    const user = userEvent.setup();
    render(<SteppedFlow steps={steps} onComplete={vi.fn()} />);
    await user.click(screen.getByText("Continue"));
    await user.click(screen.getByText("Back"));
    expect(screen.getByText("First step")).toBeInTheDocument();
  });

  it("calls onComplete on last step", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<SteppedFlow steps={steps} onComplete={onComplete} />);
    await user.click(screen.getByText("Continue"));
    await user.click(screen.getByText("Continue"));
    await user.click(screen.getByText("Complete"));
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("renders progress bar", () => {
    render(<SteppedFlow steps={steps} onComplete={vi.fn()} />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("respects validation", async () => {
    const user = userEvent.setup();
    const stepsWithValidation = [
      { title: "Step 1", content: <p>Validate me</p>, validate: () => false },
      { title: "Step 2", content: <p>Step two</p> },
    ];
    render(<SteppedFlow steps={stepsWithValidation} onComplete={vi.fn()} />);
    await user.click(screen.getByText("Continue"));
    expect(screen.getByText("Validate me")).toBeInTheDocument();
  });
});
