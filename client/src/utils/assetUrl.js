import { getBackendOrigin } from "./apiOrigin";

/**
 * Full URL for backend-served paths (`/uploads/...`) when the SPA runs on another host (e.g. Vercel + API on Render).
 */
export function resolvePublicAssetUrl(path) {
  if (!path) {
    return "";
  }
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const origin = getBackendOrigin();
  return origin ? `${origin}${normalized}` : normalized;
}
