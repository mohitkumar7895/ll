import { io } from "socket.io-client";

let socket;

const getBaseUrl = () => {
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  if (apiBase) {
    if (apiBase === "/api" || apiBase.endsWith("/api")) {
      const withoutApi = apiBase.endsWith("/api") ? apiBase.slice(0, -"/api".length) : apiBase;
      if (withoutApi === "" || withoutApi === "/") {
        return typeof window !== "undefined" ? window.location.origin : "http://localhost:5000";
      }
      return withoutApi;
    }
    return apiBase;
  }
  // Dev: same origin — Vite proxies /socket.io to backend (see vite.config.js)
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "http://localhost:5000";
};

export const getSocket = () => {
  if (!socket) {
    socket = io(getBaseUrl(), {
      autoConnect: false,
    });
  }

  return socket;
};
