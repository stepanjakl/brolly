import path from "node:path";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // svgr mirrors the @svgr/webpack rule in next.config.ts; the include makes
  // it transform plain .svg imports (default only handles ?react suffixes)
  plugins: [react(), svgr({ include: "**/*.svg" })],
  test: {
    environment: "jsdom",
    setupFiles: "./vitest.setup.ts",
  },
  resolve: {
    // mirror the "@/*" alias from tsconfig.json
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
