import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  platform: "node",
  target: "node24",
  format: "esm",
  outDir: "dist",
  fixedExtension: false,
  clean: true,
  // Bundle the workspace package; npm dependencies (incl. native argon2) stay external.
  deps: { alwaysBundle: [/^@location-manager\//] },
});
