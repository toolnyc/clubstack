import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AgendaList } from "./agenda-list";

describe("AgendaList", () => {
  it("renders empty state when no events", () => {
    render(<AgendaList events={[]} />);
    expect(screen.getByText("No events to show")).toBeInTheDocument();
  });

  it("groups events by date", () => {
    render(
      <AgendaList
        events={[
          { date: "2026-03-22", status: "booked", title: "Club Vinyl" },
          { date: "2026-03-22", status: "booked", title: "Afterparty" },
          { date: "2026-03-25", status: "busy", title: "Personal" },
        ]}
      />
    );
    expect(screen.getByText("Club Vinyl")).toBeInTheDocument();
    expect(screen.getByText("Afterparty")).toBeInTheDocument();
    expect(screen.getByText("Personal")).toBeInTheDocument();
  });

  it("shows date headers", () => {
    render(<AgendaList events={[{ date: "2026-03-22", status: "booked" }]} />);
    expect(screen.getByText("Mar 22")).toBeInTheDocument();
  });

  it("shows fee when provided", () => {
    render(
      <AgendaList
        events={[
          { date: "2026-03-22", status: "booked", title: "Gig", fee: "$1,500" },
        ]}
      />
    );
    expect(screen.getByText("$1,500")).toBeInTheDocument();
  });

  it("renders status dots", () => {
    const { container } = render(
      <AgendaList
        events={[
          { date: "2026-03-22", status: "booked" },
          { date: "2026-03-25", status: "busy" },
        ]}
      />
    );
    expect(
      container.querySelector(".agenda-list__dot--booked")
    ).toBeInTheDocument();
    expect(
      container.querySelector(".agenda-list__dot--busy")
    ).toBeInTheDocument();
  });

  it("falls back to status name when no title", () => {
    render(<AgendaList events={[{ date: "2026-03-22", status: "busy" }]} />);
    expect(screen.getByText("Busy")).toBeInTheDocument();
  });

  it("shows time when provided", () => {
    render(
      <AgendaList
        events={[{ date: "2026-03-22", status: "booked", time: "10pm – 2am" }]}
      />
    );
    expect(screen.getByText("10pm – 2am")).toBeInTheDocument();
  });
});
