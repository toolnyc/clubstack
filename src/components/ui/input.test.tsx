import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Input, Textarea, Toggle } from "./input";

describe("Input", () => {
  it("renders with visible label", () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("shows (optional) when optional", () => {
    render(<Input label="Phone" optional />);
    expect(screen.getByText("(optional)")).toBeInTheDocument();
  });

  it("shows error message below input", () => {
    render(<Input label="Email" error="Required field" />);
    const error = screen.getByRole("alert");
    expect(error).toHaveTextContent("Required field");
  });

  it("sets aria-invalid when error is present", () => {
    render(<Input label="Email" error="Bad" />);
    expect(screen.getByLabelText("Email")).toHaveAttribute(
      "aria-invalid",
      "true"
    );
  });

  it("links error to input via aria-describedby", () => {
    render(<Input label="Email" error="Required" />);
    const input = screen.getByLabelText("Email");
    const errorId = input.getAttribute("aria-describedby");
    expect(errorId).toBeTruthy();
    expect(document.getElementById(errorId!)).toHaveTextContent("Required");
  });

  it("has error class when error present", () => {
    render(<Input label="Name" error="Required" />);
    expect(screen.getByLabelText("Name")).toHaveClass(
      "input-field__input--error"
    );
  });

  it("accepts className prop", () => {
    const { container } = render(<Input label="Test" className="custom" />);
    expect(container.firstChild).toHaveClass("custom");
  });
});

describe("Textarea", () => {
  it("renders with visible label", () => {
    render(<Textarea label="Bio" />);
    expect(screen.getByLabelText("Bio")).toBeInTheDocument();
  });

  it("shows error message", () => {
    render(<Textarea label="Bio" error="Too short" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Too short");
  });

  it("shows optional marker", () => {
    render(<Textarea label="Notes" optional />);
    expect(screen.getByText("(optional)")).toBeInTheDocument();
  });
});

describe("Toggle", () => {
  it("renders with label", () => {
    render(<Toggle label="Dark mode" checked={false} onChange={() => {}} />);
    expect(screen.getByRole("switch")).toBeInTheDocument();
    expect(screen.getByText("Dark mode")).toBeInTheDocument();
  });

  it("reflects checked state via aria-checked", () => {
    render(<Toggle label="Active" checked={true} onChange={() => {}} />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("calls onChange when clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Toggle label="Toggle" checked={false} onChange={onChange} />);
    await user.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("does not fire when disabled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Toggle label="Toggle" checked={false} onChange={onChange} disabled />
    );
    await user.click(screen.getByRole("switch"));
    expect(onChange).not.toHaveBeenCalled();
  });
});
