import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_ACTIONS ? "/Team-being-human/" : "/",
  build: {
    rollupOptions: {
      input: resolve(import.meta.dirname, "app.html"),
    },
  },
});
