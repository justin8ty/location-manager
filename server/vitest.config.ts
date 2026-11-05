import { existsSync } from "node:fs";
import { defineConfig } from "vitest/config";

if (existsSync("../.env")) process.loadEnvFile("../.env");

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
    globalSetup: ["./test/global-setup.ts"],
    fileParallelism: false,
  },
});
