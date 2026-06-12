import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/.netlify/functions/api": {
        target: "http://127.0.0.1:8787",
        changeOrigin: true,
        rewrite: (requestPath) => requestPath.replace(/^\/\.netlify\/functions\/api/, "") || "/"
      },
      "/api": {
        target: "http://127.0.0.1:8787",
        changeOrigin: true,
        rewrite: (requestPath) => requestPath.replace(/^\/api/, "") || "/"
      }
    }
  }
});
