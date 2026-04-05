import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ClauseList } from "./clause-list";
import { buildClause } from "@/test/factories";

describe("ClauseList", () => {
  const noop = () => {};

  it("renders clause titles", () => {
    render(
      <ClauseList
        clauses={[
          buildClause(),
          buildClause({ id: "c2", title: "Force Majeure", sort_order: 1 }),
        ]}
        onToggle={noop}
        onContentChange={noop}
        onReorder={noop}
      />
    );
    expect(screen.getByText("Parties & Event Details")).toBeInTheDocument();
    expect(screen.getByText("Force Majeure")).toBeInTheDocument();
  });

  it("calls onToggle when toggle is clicked", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    const onToggle = vi.fn();

    render(
      <ClauseList
        clauses={[buildClause()]}
        onToggle={onToggle}
        onContentChange={noop}
        onReorder={noop}
      />
    );

    const toggle = screen.getByLabelText("Enable Parties & Event Details");
    await user.click(toggle);
    expect(onToggle).toHaveBeenCalledWith("clause-1", false);
  });

  it("expands clause to show editor when clicked", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();

    render(
      <ClauseList
        clauses={[buildClause()]}
        onToggle={noop}
        onContentChange={noop}
        onReorder={noop}
      />
    );

    await user.click(screen.getByLabelText("Expand Parties & Event Details"));
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveValue(
      "This agreement is entered into..."
    );
  });

  it("disables toggle for disabled clauses", () => {
    render(
      <ClauseList
        clauses={[buildClause({ is_enabled: false })]}
        onToggle={noop}
        onContentChange={noop}
        onReorder={noop}
      />
    );
    const toggle = screen.getByLabelText("Enable Parties & Event Details");
    expect(toggle).not.toBeChecked();
  });
});
