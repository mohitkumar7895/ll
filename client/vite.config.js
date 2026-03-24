import basicSsl from "@vitejs/plugin-basic-ssl";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

/** When `.env.production` is missing on the host (e.g. Vercel), still point the bundle at Render. */
const DEFAULT_PROD_API_BASE = "https://ll-ugjg.onrender.com/api";

// HTTPS dev → browser "secure context" (camera QR on phone via LAN works after trusting cert)
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  /** Backend API — must match where `node server.js` listens (default port 5000). */
  const proxyTarget = env.VITE_PROXY_TARGET || "http://localhost:5000";

  const define = {};
  if (mode === "production" && !env.VITE_API_BASE_URL) {
    define["import.meta.env.VITE_API_BASE_URL"] = JSON.stringify(DEFAULT_PROD_API_BASE);
  }

  return {
    plugins: [react(), basicSsl()],
    define,
    optimizeDeps: {
      include: ["face-api.js"],
    },
    server: {
      host: true,
      /** Forwards `/api/*` to Express (e.g. POST /api/payment/cash → backend). */
      proxy: {
        "/api": { target: proxyTarget, changeOrigin: true, secure: false },
        "/uploads": { target: proxyTarget, changeOrigin: true, secure: false },
        "/socket.io": { target: proxyTarget, ws: true, changeOrigin: true, secure: false },
      },
    },
  };
});
