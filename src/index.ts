import "dotenv/config";
import { WebServer } from "./server/webServer";

/**
 * Point d'entrée principal de l'application
 */
const WEB_PORT = 3000;

// Créer et démarrer le serveur web
const webServer = new WebServer(WEB_PORT);
webServer.start();

// Exporter les instances principales pour permettre l'importation depuis d'autres fichiers
export { webServer };
export { BotManager } from "./bot/botManager";
export { Logger } from "./utils/logger";
export { ErrorHandler } from "./utils/errorHandler";
export { WebServer } from "./server/webServer";
export { SocketHandler } from "./server/socketHandler";
export * from "./types";

