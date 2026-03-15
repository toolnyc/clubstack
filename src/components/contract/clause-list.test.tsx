import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ClauseList } from "./clause-list";
import type { ContractClause } from "@/types";

function makeClause(overrides: Partial<ContractClause> = {}): ContractClause {
  return {
    id: "clause-1",
    contract_id: "contract-1",
    clause_type: "parties",
    title: "Parties & Event Details",
    content: "This agreement is entered into...",
    is_enabled: true,
    sort_order: 0,
    created_at: "2026-03-15T00:00:00Z",
    updated_at: "2026-03-15T00:00:00Z",
    ...overrides,
  };
}

describe("ClauseList", () => {
  const noop = () => {};

  it("renders clause titles", () => {
    render(
      <ClauseList
        clauses={[
          makeClause(),
          makeClause({ id: "c2", title: "Force Majeure", sort_order: 1 }),
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
        clauses={[makeClause()]}
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
        clauses={[makeClause()]}
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

  it("dims disabled clauses", () => {
    const { container } = render(
      <ClauseList
        clauses={[makeClause({ is_enabled: false })]}
        onToggle={noop}
        onContentChange={noop}
        onReorder={noop}
      />
    );
    expect(
      container.querySelector(".clause-list__item--disabled")
    ).toBeInTheDocument();
  });
});
