/**
 * Architecture tests — mechanical enforcement of Clubstack conventions.
 *
 * These tests make it impossible for agents (or humans) to violate
 * project invariants. They run in CI and locally via `pnpm test`.
 */
import { describe, test, expect } from "vitest";
import fs from "fs/promises";
import path from "path";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROOT = path.resolve(__dirname, "../..");

async function globFiles(pattern: string): Promise<string[]> {
  const { glob } = await import("glob");
  return glob(pattern, { cwd: ROOT });
}

async function readFile(relativePath: string): Promise<string> {
  return fs.readFile(path.resolve(ROOT, relativePath), "utf-8");
}

// ---------------------------------------------------------------------------
// 1. Supabase imports — must use wrappers, never raw packages
//
//    Exceptions:
//    - Type-only imports (e.g. `import { type Foo }`) are allowed
//    - Webhook/API routes may use a service-role client directly
// ---------------------------------------------------------------------------

describe("supabase imports", () => {
  test("no direct @supabase/* imports in app or components", async () => {
    const files = await globFiles("src/{app,components}/**/*.{ts,tsx}");
    const violations: string[] = [];

    // Route handlers that legitimately need the service-role client
    const allowlist = ["src/app/api/stripe/webhook/route.ts"];

    for (const file of files) {
      if (allowlist.includes(file)) continue;

      const content = await readFile(file);
      const lines = content.split("\n");

      for (const line of lines) {
        // Allow type-only imports: `import { type Foo } from "@supabase/..."`
        if (/import\s+\{\s*type\s+/.test(line)) continue;

        if (
          /from\s+['"]@supabase\/ssr['"]/.test(line) ||
          /from\s+['"]@supabase\/supabase-js['"]/.test(line)
        ) {
          violations.push(file);
          break;
        }
      }
    }

    expect(
      violations,
      `Direct @supabase/* imports — use @/lib/supabase/* wrappers:\n${violations.join("\n")}`
    ).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 2. No CSS modules — Tailwind utility classes only
//
//    Note: dynamic inline styles (e.g. style={{ width: `${pct}%` }}) are
//    allowed when the value can't be expressed as a static Tailwind class.
// ---------------------------------------------------------------------------

describe("styling", () => {
  test("no CSS module imports", async () => {
    const files = await globFiles("src/**/*.{ts,tsx}");
    const violations: string[] = [];

    for (const file of files) {
      const content = await readFile(file);
      if (/import\s+\w+\s+from\s+['"].*\.module\.css['"]/.test(content)) {
        violations.push(file);
      }
    }

    expect(
      violations,
      `CSS module imports found — use Tailwind classes:\n${violations.join("\n")}`
    ).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 3. No `any` types — strict mode enforcement
// ---------------------------------------------------------------------------

describe("typescript strictness", () => {
  test("no explicit `any` type annotations", async () => {
    const files = await globFiles("src/**/*.{ts,tsx}");
    const violations: string[] = [];

    for (const file of files) {
      if (file.endsWith(".d.ts")) continue;
      // Don't scan test infrastructure for self-referential patterns
      if (file.includes("src/test/architecture")) continue;

      const content = await readFile(file);
      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (
          line.trimStart().startsWith("//") ||
          line.trimStart().startsWith("*")
        )
          continue;
        if (/:\s*any\b|as\s+any\b|<any>/.test(line)) {
          violations.push(`${file}:${i + 1}`);
        }
      }
    }

    expect(
      violations,
      `Uses \`any\` type — use \`unknown\` and narrow instead:\n${violations.join("\n")}`
    ).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 4. RLS enforcement — every CREATE TABLE must enable RLS
// ---------------------------------------------------------------------------

describe("database migrations", () => {
  test("every CREATE TABLE has RLS enabled", async () => {
    const files = await globFiles("supabase/migrations/*.sql");
    const violations: string[] = [];

    for (const file of files) {
      const content = await readFile(file);
      const lower = content.toLowerCase();

      const createMatches = lower.matchAll(
        /create\s+table\s+(?:if\s+not\s+exists\s+)?(\w+)/g
      );

      for (const match of createMatches) {
        const tableName = match[1];
        const rlsPattern = new RegExp(
          `alter\\s+table\\s+${tableName}\\s+enable\\s+row\\s+level\\s+security`
        );
        if (!rlsPattern.test(lower)) {
          violations.push(
            `${file}: table "${tableName}" missing ENABLE ROW LEVEL SECURITY`
          );
        }
      }
    }

    expect(violations, `Tables missing RLS:\n${violations.join("\n")}`).toEqual(
      []
    );
  });

  test("primary entity tables have updated_at column", async () => {
    const files = await globFiles("supabase/migrations/*.sql");
    const violations: string[] = [];

    // Junction tables, cache tables, and append-only tables that
    // intentionally omit updated_at
    const skipTables = new Set([
      "booking_dates",
      "booking_artists",
      "booking_costs",
      "calendar_cache",
      "contract_signatures",
      "invoice_line_items",
      "venue_contacts",
      "transfers",
      "threads",
      "messages",
      "technical_riders",
      "waitlist_signups",
      "booking_access_tokens", // one-time-use tokens — created once, never updated
    ]);

    for (const file of files) {
      const content = await readFile(file);
      const lower = content.toLowerCase();

      const createMatches = lower.matchAll(
        /create\s+table\s+(?:if\s+not\s+exists\s+)?(\w+)/g
      );

      for (const match of createMatches) {
        const tableName = match[1];
        if (skipTables.has(tableName)) continue;

        const tableStart = match.index!;
        const tableEnd = lower.indexOf(");", tableStart);
        if (tableEnd === -1) continue;

        const tableBlock = lower.slice(tableStart, tableEnd);
        if (!tableBlock.includes("updated_at")) {
          violations.push(
            `${file}: table "${tableName}" missing updated_at column`
          );
        }
      }
    }

    expect(
      violations,
      `Primary tables missing updated_at:\n${violations.join("\n")}`
    ).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 5. File naming — components must be kebab-case
// ---------------------------------------------------------------------------

describe("file naming", () => {
  test("component files are kebab-case", async () => {
    const files = await globFiles("src/components/**/*.{ts,tsx}");
    const violations: string[] = [];

    for (const file of files) {
      const basename = path.basename(file);
      if (basename === "index.ts" || basename === "index.tsx") continue;

      if (!/^[a-z0-9]+(-[a-z0-9]+)*\.(test\.)?(ts|tsx)$/.test(basename)) {
        violations.push(file);
      }
    }

    expect(violations, `Not kebab-case:\n${violations.join("\n")}`).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 6. No secrets in source
// ---------------------------------------------------------------------------

describe("security", () => {
  test("no hardcoded secrets in source files", async () => {
    const files = await globFiles("src/**/*.{ts,tsx}");
    const violations: string[] = [];

    for (const file of files) {
      // Don't scan this test file — it contains patterns as regex literals
      if (file.includes("src/test/architecture")) continue;

      const content = await readFile(file);
      if (
        /sk_live_[a-zA-Z0-9]{10,}/.test(content) ||
        /sk_test_[a-zA-Z0-9]{10,}/.test(content) ||
        /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]+/.test(content)
      ) {
        violations.push(file);
      }
    }

    expect(
      violations,
      `Hardcoded secrets found:\n${violations.join("\n")}`
    ).toEqual([]);
  });
});
