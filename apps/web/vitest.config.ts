import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- vite/plugin-react type mismatch with vitest
  plugins: [react() as any],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    globals: true,
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      exclude: [
        "node_modules/**",
        "src/test/**",
        "**/*.d.ts",
        "**/*.test.{ts,tsx}",
        "src/mocks/**",
      ],
      thresholds: {
        lines: 50,
        functions: 50,
        branches: 50,
        statements: 50,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
