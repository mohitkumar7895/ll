import axios from "axios";

/** Dev: relative `/api` → Vite proxy → same origin (HTTPS ok, no CORS). Prod: set VITE_API_BASE_URL. */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
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
