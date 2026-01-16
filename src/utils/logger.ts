import { Server as SocketIOServer } from "socket.io";

/**
 * Utilitaire pour logger des messages dans la console et sur le web
 */
export class Logger {
  private io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  /**
   * Log un message dans la console et l'envoie au web
   */
  log(message: string): void {
    console.log(message);
    this.io.emit("log", message);
  }
}

