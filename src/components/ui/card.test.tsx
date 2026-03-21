import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Card, CardHeader, CardContent, CardFooter } from "./card";

describe("Card", () => {
  it("applies card class", () => {
    const { container } = render(<Card>body</Card>);
    expect(container.firstChild).toHaveClass("card");
  });

  it("merges custom className", () => {
    const { container } = render(<Card className="p-4">body</Card>);
    expect(container.firstChild).toHaveClass("card", "p-4");
  });
});

describe("CardHeader", () => {
  it("applies card__header class", () => {
    const { container } = render(<CardHeader>head</CardHeader>);
    expect(container.firstChild).toHaveClass("card__header");
  });
});

describe("CardContent", () => {
  it("applies card__content class", () => {
    const { container } = render(<CardContent>body</CardContent>);
    expect(container.firstChild).toHaveClass("card__content");
  });
});

describe("CardFooter", () => {
  it("applies card__footer class", () => {
    const { container } = render(<CardFooter>foot</CardFooter>);
    expect(container.firstChild).toHaveClass("card__footer");
  });
});
