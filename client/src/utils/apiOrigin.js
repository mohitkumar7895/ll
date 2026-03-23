/**
 * Public origin of the Node API (no `/api` suffix). Used for Socket.io and `/uploads` URLs.
 *
 * If `VITE_API_BASE_URL` is missing from the production bundle (e.g. Vercel build without env files),
 * requests to `/uploads/...` would otherwise use the frontend origin and return HTML — breaking images.
 * For `*.vercel.app` we fall back to `VITE_PUBLIC_API_ORIGIN` or the default Render host below.
 */
const DEFAULT_PROD_API_ORIGIN = "https://ll-ugjg.onrender.com";

function stripTrailingSlash(s) {
  return String(s).replace(/\/$/, "");
}

export function getBackendOrigin() {
  const apiBase = import.meta.env.VITE_API_BASE_URL;

  if (apiBase) {
    if (apiBase === "/api") {
      if (typeof window !== "undefined") {
        return window.location.origin;
      }
      return "http://localhost:5000";
    }
    if (apiBase.endsWith("/api")) {
      const withoutApi = apiBase.slice(0, -"/api".length);
      if (withoutApi === "" || withoutApi === "/") {
        if (typeof window !== "undefined") {
          return window.location.origin;
        }
        return "http://localhost:5000";
      }
      return stripTrailingSlash(withoutApi);
    }
    return stripTrailingSlash(apiBase);
  }

  const fromEnv = import.meta.env.VITE_PUBLIC_API_ORIGIN;
  if (fromEnv) {
    return stripTrailingSlash(fromEnv);
  }

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host.endsWith(".vercel.app")) {
      return DEFAULT_PROD_API_ORIGIN;
    }
    return window.location.origin;
  }

  return "http://localhost:5000";
}
