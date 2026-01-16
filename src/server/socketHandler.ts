import { Socket } from "socket.io";
import { BotManager } from "../bot/botManager";
import { BotConfig } from "../types";
import { Logger } from "../utils/logger";

/**
 * Gère les événements Socket.IO
 */
export class SocketHandler {
  private botManager: BotManager;
  private logger: Logger;

  constructor(botManager: BotManager, logger: Logger) {
    this.botManager = botManager;
    this.logger = logger;
  }

  /**
   * Configure les gestionnaires d'événements Socket.IO
   */
  setupSocketHandlers(socket: Socket): void {
    // Envoyer l'état actuel au client
    socket.emit("bot_connected", this.botManager.getBot() !== null);
    this.botManager.updateWebStatus();

    // Gestion de la connexion du bot
    socket.on("connect_bot", (botConfig: BotConfig) => {
      try {
        // Validation des données
        if (!botConfig.host || !botConfig.port || !botConfig.username) {
          socket.emit("log", "❌ Veuillez remplir tous les champs requis.");
          return;
        }

        const port = typeof botConfig.port === "string" 
          ? parseInt(botConfig.port) 
          : botConfig.port;

        if (isNaN(port) || port < 1 || port > 65535) {
          socket.emit("log", "❌ Le port doit être un nombre entre 1 et 65535.");
          return;
        }

        this.botManager.connectBot({
          host: botConfig.host.trim(),
          port: port,
          username: botConfig.username.trim(),
          auth: botConfig.auth || "offline",
        });
      } catch (err) {
        const error = err as Error;
        this.logger.log("❌ Erreur lors de la connexion: " + error.message);
        socket.emit("log", "❌ Erreur lors de la connexion: " + error.message);
      }
    });

    // Gestion de la déconnexion du bot
    socket.on("disconnect_bot", () => {
      this.botManager.disconnectBot();
    });

    // Gestion de la téléportation
    socket.on("teleport_to", (username: string) => {
      const bot = this.botManager.getBot();
      if (!bot) {
        socket.emit("log", "❌ Le bot n'est pas connecté.");
        return;
      }

      const cleanUsername = username.trim();

      if (cleanUsername) {
        this.logger.log(`🚀 Téléportation vers : ${cleanUsername}`);
        bot.chat(`/tpa ${cleanUsername}`);
      }
    });

    // Réception des commandes
    socket.on("command", (cmd: string) => {
      const bot = this.botManager.getBot();
      if (!bot) {
        socket.emit("log", "❌ Le bot n'est pas initialisé.");
        return;
      }

      switch (cmd) {
        case "start_farm":
          this.botManager.startFarm();
          break;
        case "stop_farm":
          this.botManager.stopFarm();
          break;
        case "dump_inventory":
          this.botManager.dumpInventory();
          break;
        case "show_inventory":
          this.botManager.showInventory();
          break;
        case "get_pos":
          this.botManager.updateWebStatus();
          const botEntity = this.botManager.getBot()?.entity;
          if (botEntity) {
            this.logger.log(`📍 Position: ${botEntity.position}`);
          }
          break;
        default:
          this.logger.log("Commande inconnue: " + cmd);
      }
    });
  }
}

