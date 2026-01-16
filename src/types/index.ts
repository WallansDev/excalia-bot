import { Bot } from "mineflayer";
import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import { Express } from "express";

/**
 * Configuration pour la connexion du bot
 */
export interface BotConfig {
  host: string;
  port: number;
  username: string;
  auth: "offline" | "microsoft" | "mojang";
}

/**
 * Données pour l'authentification Microsoft
 */
export interface MsaCodeData {
  verification_uri: string;
  user_code: string;
  message?: string;
}

/**
 * Options pour la création du bot avec support Microsoft
 */
export interface BotOptions {
  host: string;
  port: number;
  username: string;
  auth?: "offline" | "microsoft" | "mojang";
  onMsaCode?: (data: MsaCodeData) => void;
}

/**
 * Données de statut envoyées au web
 */
export interface StatusUpdate {
  health: number;
  pos: string;
  xp: {
    level: number;
    progress: number;
  };
}

/**
 * Configuration du serveur web
 */
export interface WebServerConfig {
  app: Express;
  server: HTTPServer;
  io: SocketIOServer;
  port: number;
}

/**
 * État global du bot
 */
export interface BotState {
  bot: Bot | null;
  farmChasseurActive: boolean;
  farmChasseurInterval: NodeJS.Timeout | null;
  nextAttackTime: number;
}

