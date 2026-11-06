import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  // The router plugin must run before the React plugin.
  plugins: [tanstackRouter({ target: "react", autoCodeSplitting: true }), react(), tailwindcss()],
  // maplibre-gl's worker is an ES module.
  worker: { format: "es" },
  server: {
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
