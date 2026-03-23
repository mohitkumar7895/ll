import { io } from "socket.io-client";
import { getBackendOrigin } from "../utils/apiOrigin";

let socket;

export const getSocket = () => {
  if (!socket) {
    socket = io(getBackendOrigin(), {
      autoConnect: false,
    });
  }

  return socket;
};
