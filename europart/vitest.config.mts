import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    alias: {
      "server-only": path.join(root, "src/test/empty-module.ts"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    // Unit tests only by default. Integration suite needs Postgres (see test:integration).
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    exclude: ["src/**/*.integration.test.ts", "node_modules"],
    fileParallelism: false,
    maxWorkers: 1,
    testTimeout: 20_000,
    env: {
      DATABASE_URL:
        "postgresql://europart:europart@127.0.0.1:5432/europart_test?schema=public",
    },
  },
});
