import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { NAV_ROUTES, APP_ROUTES, DYNAMIC_ROUTES } from "./routes";

const APP_DIR = path.resolve(__dirname, "../app");

/**
 * Resolve a route to its expected page.tsx location(s).
 * Next.js App Router can nest pages in route groups like (app), (auth), (marketing).
 */
function findPageFile(route: string): string | null {
  // Direct path: src/app/[route]/page.tsx
  const directPath = path.join(APP_DIR, route, "page.tsx");
  if (fs.existsSync(directPath)) return directPath;

  // Check route groups: src/app/(group)/[route]/page.tsx
  const entries = fs.readdirSync(APP_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name.startsWith("(")) {
      const groupPath = path.join(APP_DIR, entry.name, route, "page.tsx");
      if (fs.existsSync(groupPath)) return groupPath;
    }
  }

  return null;
}

describe("route smoke tests", () => {
  describe("every nav route has a page", () => {
    for (const route of NAV_ROUTES) {
      it(`${route} resolves to a page.tsx`, () => {
        const pageFile = findPageFile(route);
        expect(
          pageFile,
          `No page.tsx found for nav route ${route}`
        ).not.toBeNull();
      });
    }
  });

  describe("every app route has a page", () => {
    for (const route of APP_ROUTES) {
      it(`${route} resolves to a page.tsx`, () => {
        const pageFile = findPageFile(route);
        expect(
          pageFile,
          `No page.tsx found for app route ${route}`
        ).not.toBeNull();
      });
    }
  });

  describe("every dynamic route has a page", () => {
    for (const route of DYNAMIC_ROUTES) {
      it(`${route} resolves to a page.tsx`, () => {
        // Convert [param] segments to literal directory names
        const fsRoute = route;
        const pageFile = findPageFile(fsRoute);
        expect(
          pageFile,
          `No page.tsx found for dynamic route ${route}`
        ).not.toBeNull();
      });
    }
  });

  describe("nav consistency", () => {
    it("sidebar NAV_ITEMS match NAV_ROUTES", () => {
      // Read the sidebar source and extract hrefs
      const sidebarPath = path.resolve(
        __dirname,
        "../components/layout/sidebar.tsx"
      );
      const content = fs.readFileSync(sidebarPath, "utf-8");
      const hrefMatches = [...content.matchAll(/href:\s*"([^"]+)"/g)].map(
        (m) => m[1]
      );

      for (const href of hrefMatches) {
        expect(
          [...NAV_ROUTES, "/dashboard", "/settings"].includes(href as string),
          `Sidebar links to ${href} which is not in NAV_ROUTES`
        ).toBe(true);
      }
    });

    it("bottom tabs match NAV_ROUTES", () => {
      const tabsPath = path.resolve(
        __dirname,
        "../components/layout/bottom-tabs.tsx"
      );
      const content = fs.readFileSync(tabsPath, "utf-8");
      const hrefMatches = [...content.matchAll(/href:\s*"([^"]+)"/g)].map(
        (m) => m[1]
      );

      for (const href of hrefMatches) {
        expect(
          (NAV_ROUTES as readonly string[]).includes(href),
          `Bottom tabs links to ${href} which is not in NAV_ROUTES`
        ).toBe(true);
      }
    });
  });
});
