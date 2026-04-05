import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Modal } from "./modal";

// jsdom doesn't support HTMLDialogElement natively
beforeAll(() => {
  HTMLDialogElement.prototype.showModal =
    HTMLDialogElement.prototype.showModal ||
    function (this: HTMLDialogElement) {
      this.setAttribute("open", "");
    };
  HTMLDialogElement.prototype.close =
    HTMLDialogElement.prototype.close ||
    function (this: HTMLDialogElement) {
      this.removeAttribute("open");
    };
});

describe("Modal", () => {
  it("renders title and children when open", () => {
    render(
      <Modal open onClose={vi.fn()} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );
    expect(screen.getByText("Test Modal")).toBeInTheDocument();
    expect(screen.getByText("Modal content")).toBeInTheDocument();
  });

  it("has close button", () => {
    render(
      <Modal open onClose={vi.fn()} title="Test">
        Content
      </Modal>
    );
    expect(screen.getByLabelText("Close")).toBeInTheDocument();
  });

  it("calls onClose when close button clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Test">
        Content
      </Modal>
    );
    await user.click(screen.getByLabelText("Close"));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
