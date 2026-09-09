import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./test/setup.ts"],
    hookTimeout: 120_000, // first run downloads the mongod binary
    testTimeout: 30_000,
    fileParallelism: false, // one in-memory mongod, shared connection
  },
});
