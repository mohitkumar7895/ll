/**
 * Full URL for backend-served paths (`/uploads/...`) when the SPA runs on another host (Vercel + API on Render).
 * Uses `VITE_API_BASE_URL` the same way as `services/socket.js`.
 */
export function resolvePublicAssetUrl(path) {
  if (!path) {
    return "";
  }
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;

  const apiBase = import.meta.env.VITE_API_BASE_URL;
  let origin = "";

  if (apiBase) {
    if (apiBase === "/api") {
      origin = typeof window !== "undefined" ? window.location.origin : "";
    } else if (apiBase.endsWith("/api")) {
      const withoutApi = apiBase.slice(0, -"/api".length);
      origin =
        withoutApi === "" || withoutApi === "/"
          ? typeof window !== "undefined"
            ? window.location.origin
            : ""
          : withoutApi.replace(/\/$/, "");
    } else {
      origin = String(apiBase).replace(/\/$/, "");
    }
  } else if (typeof window !== "undefined") {
    origin = window.location.origin;
  }

  return origin ? `${origin}${normalized}` : normalized;
}
