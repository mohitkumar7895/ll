import axios from "axios";

/**
 * Browser shows the Vite URL (e.g. https://localhost:5173) but the path is `/api/...`.
 * Vite `server.proxy` forwards `/api` to Express (e.g. http://127.0.0.1:5000), so the
 * request is handled by the Node backend — not by the React dev server.
 *
 * Dev: baseURL `/api` + relative paths like `/payment/cash` → `/api/payment/cash` (proxied).
 * Prod: `VITE_API_BASE_URL` (e.g. `https://api.example.com/api`).
 */
const api = axios.create({
  /** Dev: relative `/api` → Vite `server.proxy` → Express. Never use bare `localhost:5000` in browser with HTTPS Vite. */
  baseURL:
    import.meta.env.DEV || import.meta.env.MODE === "development"
      ? "/api"
      : import.meta.env.VITE_API_BASE_URL || "/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("library_token");
  if (token) {
    config.headers.Authorization = "Bearer " + token;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error.response?.data?.message || error.response?.data?.error || error.message)
);

export default api;
