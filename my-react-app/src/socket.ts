import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";

const resolveBackendUrl = (): string => {
  const meta = typeof import.meta !== "undefined"
    ? (import.meta as { env?: Record<string, string | undefined> }).env
    : undefined;

  return meta?.VITE_BACKEND_URL ?? "http://localhost:3000";
};

export const SOCKET_ENDPOINT = resolveBackendUrl();

let socketInstance: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socketInstance) {
    socketInstance = io(SOCKET_ENDPOINT);
  }

  return socketInstance;
};

export const disconnectSocket = () => {
  if (!socketInstance) {
    return;
  }

  socketInstance.disconnect();
  socketInstance = null;
};

export type SessionSocket = Socket;
