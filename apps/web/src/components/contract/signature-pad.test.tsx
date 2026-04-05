import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { SignaturePad } from "./signature-pad";

describe("SignaturePad", () => {
  it("renders type and draw tabs", () => {
    render(<SignaturePad onSign={vi.fn()} />);
    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("Draw")).toBeInTheDocument();
  });

  it("shows typed input by default", () => {
    render(<SignaturePad onSign={vi.fn()} />);
    expect(screen.getByLabelText("Full name")).toBeInTheDocument();
  });

  it("shows canvas when draw tab selected", async () => {
    const user = userEvent.setup();
    render(<SignaturePad onSign={vi.fn()} />);
    await user.click(screen.getByText("Draw"));
    expect(screen.getByLabelText("Draw your signature")).toBeInTheDocument();
  });

  it("calls onSign with typed name", async () => {
    const user = userEvent.setup();
    const onSign = vi.fn();
    render(<SignaturePad onSign={onSign} />);

    await user.type(screen.getByLabelText("Full name"), "John Doe");
    await user.click(screen.getByText("Sign contract"));

    expect(onSign).toHaveBeenCalledWith("John Doe", "typed");
  });

  it("disables sign button when typed name is empty", () => {
    render(<SignaturePad onSign={vi.fn()} />);
    const btn = screen.getByText("Sign contract").closest("button");
    expect(btn).toBeDisabled();
  });

  it("shows signature preview when name is typed", async () => {
    const user = userEvent.setup();
    render(<SignaturePad onSign={vi.fn()} />);
    await user.type(screen.getByLabelText("Full name"), "Jane Smith");
    expect(screen.getByLabelText("Signature preview")).toHaveTextContent(
      "Jane Smith"
    );
  });

  it("shows legal disclaimer", () => {
    render(<SignaturePad onSign={vi.fn()} />);
    expect(
      screen.getByText(/electronic signature has the same legal effect/)
    ).toBeInTheDocument();
  });
});
