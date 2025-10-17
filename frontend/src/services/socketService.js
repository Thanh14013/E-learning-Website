import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  transports: ["websocket"],
});

socket.on("connect", () => console.log("Socket CONNECTED:", socket.id));
socket.on("disconnect", () => console.log("Socket DISCONNECTED"));

export default socket;
