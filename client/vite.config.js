import basicSsl from "@vitejs/plugin-basic-ssl";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

/** When `.env.production` is missing on the host (e.g. Vercel), still point the bundle at Render. */
const DEFAULT_PROD_API_BASE = "https://ll-ugjg.onrender.com/api";

// HTTPS dev → browser "secure context" (camera QR on phone via LAN works after trusting cert)
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const viteApiBase =
    env.VITE_API_BASE_URL || (mode === "production" ? DEFAULT_PROD_API_BASE : "");

  return {
    plugins: [react(), basicSsl()],
    define: {
      "import.meta.env.VITE_API_BASE_URL": JSON.stringify(viteApiBase),
    },
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
  };
});
