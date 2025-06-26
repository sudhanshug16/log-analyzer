import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  plugins: [tailwindcss()],
  server: {
    port: 3333,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  base: process.env.NODE_ENV === "production" ? "/log-analyzer/" : "/",
});
