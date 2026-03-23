import basicSsl from "@vitejs/plugin-basic-ssl";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// HTTPS dev → browser "secure context" (camera QR on phone via LAN works after trusting cert)
export default defineConfig({
  plugins: [react(), basicSsl()],
  optimizeDeps: {
    include: ["face-api.js"],
  },
  server: {
    host: true,
    proxy: {
      "/api": { target: "http://localhost:5000", changeOrigin: true, secure: false },
      "/uploads": { target: "http://localhost:5000", changeOrigin: true, secure: false },
      "/socket.io": { target: "http://localhost:5000", ws: true, changeOrigin: true, secure: false },
    },
  },
});
