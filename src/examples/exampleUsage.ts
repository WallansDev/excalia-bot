/**
 * Exemple d'utilisation de l'architecture TypeScript
 * 
 * Ce fichier montre comment importer et utiliser les différents modules
 * de l'application pour créer vos propres fonctionnalités.
 */

import { BotManager } from "../bot/botManager";
import { Logger } from "../utils/logger";
import { ErrorHandler } from "../utils/errorHandler";
import { WebServer } from "../server/webServer";
import { BotConfig } from "../types";
import { Server as SocketIOServer } from "socket.io";

/**
 * Exemple 1 : Créer une nouvelle fonctionnalité qui utilise le BotManager
 */
export class ExampleFeature {
  constructor(
    private botManager: BotManager,
    private logger: Logger
  ) {}

  /**
   * Exemple de méthode qui utilise le bot
   */
  public async performAction(): Promise<void> {
    const bot = this.botManager.getBot();
    
    if (!bot) {
      this.logger.log("❌ Le bot n'est pas connecté");
      return;
    }

    this.logger.log("✅ Bot disponible, action effectuée !");
    // Votre logique ici
  }

  /**
   * Exemple de méthode qui utilise l'état du bot
   */
  public checkBotState(): void {
    const state = this.botManager.getState();
    this.logger.log(`Farm actif: ${state.farmChasseurActive}`);
  }
}

/**
 * Exemple 2 : Créer un gestionnaire personnalisé
 */
export class CustomHandler {
  constructor(
    private botManager: BotManager,
    private logger: Logger
  ) {}

  /**
   * Exemple de connexion personnalisée
   */
  public connectWithCustomConfig(): void {
    const config: BotConfig = {
      host: "localhost",
      port: 25565,
      username: "MonBotPersonnalise",
      auth: "offline",
    };

    this.botManager.connectBot(config);
    this.logger.log("Connexion personnalisée initiée");
  }
}

/**
 * Exemple 3 : Utiliser depuis le point d'entrée principal
 * 
 * Dans src/index.ts, vous pouvez faire :
 * 
 * import { webServer } from './index';
 * import { ExampleFeature } from './examples/exampleUsage';
 * 
 * const exampleFeature = new ExampleFeature(
 *   webServer.getBotManager(),
 *   webServer.getLogger()
 * );
 * 
 * exampleFeature.performAction();
 */

