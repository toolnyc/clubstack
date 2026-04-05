import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DataTable } from "./data-table";

vi.mock("@/lib/hooks/use-breakpoint", () => ({
  useBreakpoint: () => "desktop",
}));

interface Item {
  id: string;
  name: string;
  value: number;
}

const columns = [
  { key: "name", header: "Name", render: (item: Item) => item.name },
  { key: "value", header: "Value", render: (item: Item) => `$${item.value}` },
];

const data: Item[] = [
  { id: "1", name: "Alpha", value: 100 },
  { id: "2", name: "Beta", value: 200 },
];

describe("DataTable", () => {
  it("renders table headers", () => {
    render(<DataTable columns={columns} data={data} keyField="id" />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Value")).toBeInTheDocument();
  });

  it("renders data rows", () => {
    render(<DataTable columns={columns} data={data} keyField="id" />);
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("$200")).toBeInTheDocument();
  });

  it("shows empty message when no data", () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        keyField="id"
        emptyMessage="Nothing here"
      />
    );
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });

  it("calls onRowClick", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={data}
        keyField="id"
        onRowClick={onClick}
      />
    );
    await user.click(screen.getByText("Alpha"));
    expect(onClick).toHaveBeenCalledWith(data[0]);
  });
});
