import path from "path";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

// Integration tests run against the local Supabase stack using the same
// EXPO_PUBLIC_* env vars the app uses (written by scripts/dev-local.sh).
const env = loadEnv("development", __dirname, "EXPO_PUBLIC_");

export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
    env,
    testTimeout: 15_000,
  },
  resolve: {
    alias: {
      "react-native-url-polyfill/auto": path.resolve(
        __dirname,
        "test/stubs/empty.ts"
      ),
      "react-native": path.resolve(__dirname, "test/stubs/react-native.ts"),
      "expo-secure-store": path.resolve(
        __dirname,
        "test/stubs/expo-secure-store.ts"
      ),
      "@": path.resolve(__dirname, "."),
    },
  },
});
