import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vite.dev/config/
export default defineConfig({
  esbuild: {
    target: "es2022",
  },
  build: {
    target: "es2022",
  },
  plugins: [vue()],
});
