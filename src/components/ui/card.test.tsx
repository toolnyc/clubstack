import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Card, CardHeader, CardContent, CardFooter } from "./card";

describe("Card", () => {
  it("renders children", () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });

  it("applies card class", () => {
    const { container } = render(<Card>Test</Card>);
    expect(container.firstChild).toHaveClass("card");
  });

  it("accepts className prop", () => {
    const { container } = render(<Card className="custom">Test</Card>);
    expect(container.firstChild).toHaveClass("custom");
  });

  it("renders header, content, and footer sections", () => {
    render(
      <Card>
        <CardHeader>Header</CardHeader>
        <CardContent>Content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>
    );
    expect(
      screen.getByText("Header").closest(".card__header")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Content").closest(".card__content")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Footer").closest(".card__footer")
    ).toBeInTheDocument();
  });
});
