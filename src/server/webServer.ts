import express, { Express } from "express";
import { createServer, Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import path from "path";
import { WebServerConfig } from "../types";
import { SocketHandler } from "./socketHandler";
import { BotManager } from "../bot/botManager";
import { Logger } from "../utils/logger";
import { ErrorHandler } from "../utils/errorHandler";

/**
 * Gère le serveur web et Socket.IO
 */
export class WebServer {
  private app: Express;
  private server: HTTPServer;
  private io: SocketIOServer;
  private port: number;
  private logger: Logger;
  private errorHandler: ErrorHandler;
  private botManager: BotManager;
  private socketHandler: SocketHandler;

  constructor(port: number = 3000) {
    this.port = port;
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server);

    // Initialiser les dépendances
    this.logger = new Logger(this.io);
    this.errorHandler = new ErrorHandler(this.logger);
    this.botManager = new BotManager(this.logger, this.errorHandler, this.io);
    this.socketHandler = new SocketHandler(this.botManager, this.logger);

    this.setupRoutes();
    this.setupSocketIO();
  }

  /**
   * Configure les routes Express
   */
  private setupRoutes(): void {
    this.app.get("/", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dashboard.html"));
    });
  }

  /**
   * Configure Socket.IO
   */
  private setupSocketIO(): void {
    this.io.on("connection", (socket) => {
      this.socketHandler.setupSocketHandlers(socket);
    });
  }

  /**
   * Démarre le serveur web
   */
  start(): void {
    this.server.listen(this.port, () => {
      console.log(
        `\n💻 INTERFACE GRAPHIQUE DISPONIBLE SUR: http://localhost:${this.port}`
      );
      console.log("---------------------------------------------------");
      this.logger.log("⏳ En attente de connexion du bot depuis l'interface web...");
    });
  }

  /**
   * Retourne la configuration du serveur
   */
  getConfig(): WebServerConfig {
    return {
      app: this.app,
      server: this.server,
      io: this.io,
      port: this.port,
    };
  }

  /**
   * Retourne l'instance du bot manager
   */
  getBotManager(): BotManager {
    return this.botManager;
  }

  /**
   * Retourne l'instance du logger
   */
  getLogger(): Logger {
    return this.logger;
  }
}

