// eslint-disable-next-line @typescript-eslint/no-var-requires
const mineflayer = require("mineflayer");
import { Bot } from "mineflayer";
import { BotConfig, MsaCodeData, BotState } from "../types";
import { Logger } from "../utils/logger";
import { ErrorHandler } from "../utils/errorHandler";
import { Server as SocketIOServer } from "socket.io";

// Types pour les options de mineflayer
interface MineflayerBotOptions {
  host: string;
  port: number;
  username: string;
  auth?: "offline" | "microsoft" | "mojang";
  onMsaCode?: (data: MsaCodeData) => void;
}

/**
 * Gère la connexion, déconnexion et les événements du bot
 */
export class BotManager {
  private state: BotState;
  private logger: Logger;
  private errorHandler: ErrorHandler;
  private io: SocketIOServer;

  constructor(logger: Logger, errorHandler: ErrorHandler, io: SocketIOServer) {
    this.state = {
      bot: null,
      farmChasseurActive: false,
      farmChasseurInterval: null,
      nextAttackTime: 0,
    };
    this.logger = logger;
    this.errorHandler = errorHandler;
    this.io = io;
  }

  /**
   * Retourne l'instance du bot
   */
  getBot(): Bot | null {
    return this.state.bot;
  }

  /**
   * Retourne l'état du bot
   */
  getState(): BotState {
    return this.state;
  }

  /**
   * Connecte le bot au serveur
   */
  connectBot(botConfig: BotConfig): void {
    // Si un bot est déjà connecté, on le déconnecte d'abord
    if (this.state.bot) {
      this.disconnectBot();
    }

    this.logger.log(`🔌 Connexion au serveur ${botConfig.host}:${botConfig.port}...`);

    const botOptions: MineflayerBotOptions = {
      host: botConfig.host,
      port: botConfig.port,
      username: botConfig.username,
      auth: botConfig.auth || "offline",
    };

    // Gestion de l'authentification Microsoft avec callback pour le lien de validation
    if (botConfig.auth === "microsoft") {
      botOptions.onMsaCode = (data: MsaCodeData) => {
        const message =
          `🔐 Authentification Microsoft requise\n\n` +
          `Veuillez ouvrir ce lien dans votre navigateur :\n${data.verification_uri}\n\n` +
          `Code de vérification : ${data.user_code}\n\n` +
          `Une fois authentifié, la connexion se poursuivra automatiquement.`;

        this.logger.log(message);

        // Envoyer un événement spécial pour afficher le lien dans un pop-up
        this.io.emit("msa_code", {
          verification_uri: data.verification_uri,
          user_code: data.user_code,
          message: data.message || "Veuillez vous authentifier avec Microsoft",
        });
      };
    }

    try {
      this.state.bot = mineflayer.createBot(botOptions);
      this.initBotEvents();
    } catch (err) {
      const error = err as Error;
      this.logger.log("❌ Erreur lors de la création du bot: " + error.message);
      this.io.emit("bot_connected", false);
      this.state.bot = null;
    }
  }

  /**
   * Déconnecte le bot
   */
  disconnectBot(): void {
    if (!this.state.bot) {
      this.logger.log("⚠️ Aucun bot à déconnecter.");
      return;
    }

    // Arrêter le farm si actif
    if (this.state.farmChasseurActive) {
      this.stopFarm();
    }

    this.logger.log("👋 Déconnexion du bot...");
    this.state.bot.end();
    this.state.bot = null;
    this.io.emit("bot_connected", false);
  }

  /**
   * Initialise les événements du bot
   */
  private initBotEvents(): void {
    if (!this.state.bot) return;

    this.state.bot.on("login", () => {
      this.logger.log("✅ Bot connecté au serveur avec succès!");
      this.io.emit("bot_connected", true);
      this.updateWebStatus();
    });

    this.state.bot.on("experience", () => {
      this.updateWebStatus();
    });

    this.state.bot.on("error", (err: Error & { code?: string }) => {
      this.errorHandler.handleError(err);
      this.io.emit("bot_connected", false);
    });

    this.state.bot.on("end", () => {
      this.logger.log("👋 Bot déconnecté.");
      this.io.emit("bot_connected", false);
      this.state.bot = null;
    });

    this.state.bot.on("kicked", (reason: string | object, loggedIn: boolean) => {
      const reasonText =
        typeof reason === "string" ? reason : JSON.stringify(reason);
      this.logger.log(`🚫 Bot expulsé du serveur: ${reasonText}`);
      this.io.emit("bot_connected", false);
    });

    this.state.bot.on("health", () => this.updateWebStatus());
    this.state.bot.on("move", () => {
      /* Trop de spam si on log tout */
    });
  }

  /**
   * Met à jour le statut du bot sur le web
   */
  updateWebStatus(): void {
    if (!this.state.bot || !this.state.bot.entity) return;
    const pos = this.state.bot.entity.position;

    this.io.emit("status_update", {
      health: this.state.bot.health,
      pos: `X:${pos.x.toFixed(0)} Y:${pos.y.toFixed(0)} Z:${pos.z.toFixed(0)}`,
      xp: {
        level: this.state.bot.experience.level,
        progress: this.state.bot.experience.progress,
      },
    });
  }

  /**
   * Démarre le farm chasseur
   */
  startFarm(): void {
    if (this.state.farmChasseurActive) {
      this.logger.log("⚠️ Le farm est déjà actif.");
      return;
    }
    this.state.farmChasseurActive = true;
    this.logger.log("⚔️ Farm Chasseur ACTIVÉ");

    this.executeFarmChasseur();
    this.state.farmChasseurInterval = setInterval(() => {
      if (!this.state.farmChasseurActive) {
        if (this.state.farmChasseurInterval) {
          clearInterval(this.state.farmChasseurInterval);
        }
        return;
      }
      this.executeFarmChasseur();
    }, 2000);
  }

  /**
   * Arrête le farm chasseur
   */
  stopFarm(): void {
    if (!this.state.farmChasseurActive) {
      this.logger.log("⚠️ Le farm n'est pas actif.");
      return;
    }
    this.state.farmChasseurActive = false;
    if (this.state.farmChasseurInterval) {
      clearInterval(this.state.farmChasseurInterval);
    }
    this.logger.log("🛑 Farm Chasseur ARRÊTÉ");
  }

  /**
   * Exécute une action de farm chasseur
   */
  private executeFarmChasseur(): void {
    if (!this.state.bot || !this.state.bot.entity) return;
    const center = this.state.bot.entity.position;
    const radius = 5;

    // Récupération des mobs
    const nearbyMobs = Object.values(this.state.bot.entities).filter((entity) => {
      if (!entity || !entity.position) return false;
      if (entity.id === this.state.bot!.entity.id) return false;
      if (entity.type === "player") return false;

      const isMobType = entity.type === "mob";
      const isMobKind =
        typeof entity.kind === "string" &&
        entity.kind.toLowerCase().includes("mob");
      const hasDisplay = Boolean(entity.displayName);
      if (!isMobType && !isMobKind && !hasDisplay) return false;

      const invalidNames = ["experience_orb", "xp_orb", "item", "arrow"];
      if (invalidNames.includes(entity.name)) return false;

      return entity.position.distanceTo(center) <= radius;
    });

    if (nearbyMobs.length === 0) return;

    // Trier par distance
    nearbyMobs.sort(
      (a, b) => a.position.distanceTo(center) - b.position.distanceTo(center)
    );
    const target = nearbyMobs[0];

    const now = Date.now();
    if (now < this.state.nextAttackTime) return;

    const current = this.state.bot.entities[target.id];
    if (!current || !current.position) return;

    const dist = current.position.distanceTo(this.state.bot.entity.position);
    if (dist > 3.5) return;

    const lookPos = current.position.offset(0, current.height ?? 1.2, 0);

    this.state.bot
      .lookAt(lookPos, true)
      .then(() => {
        if (!this.state.bot!.entities[target.id]) return;
        try {
          this.state.bot!.attack(current);
          this.state.nextAttackTime = Date.now() + 600;
          this.logger.log(
            `⚔️ Coup porté sur ${
              current.displayName || current.name
            } (dist: ${dist.toFixed(1)})`
          );
        } catch (err) {
          // Ignorer les petites erreurs d'attaque
        }
      })
      .catch(() => {});
  }

  /**
   * Vide l'inventaire dans un coffre
   */
  async dumpInventory(): Promise<void> {
    if (!this.state.bot) return;
    this.logger.log("📦 Recherche d'un coffre...");

    const chestBlock = this.state.bot.findBlock({
      matching: (block) =>
        block && ["chest", "trapped_chest", "barrel"].includes(block.name),
      maxDistance: 4,
    });

    if (!chestBlock) {
      this.logger.log("❌ Aucun coffre trouvé à proximité.");
      return;
    }

    try {
      const chest = await this.state.bot.openChest(chestBlock);
      this.logger.log("📂 Coffre ouvert. Dépôt en cours...");

      const items = this.state.bot.inventory.items();
      for (const item of items) {
        try {
          await chest.deposit(item.type, null, item.count);
          this.logger.log(`> Déposé: ${item.name} x${item.count}`);
        } catch (err) {
          // Erreur mineure item
        }
      }
      chest.close();
      this.logger.log("✅ Inventaire vidé avec succès.");
    } catch (err) {
      const error = err as Error;
      this.logger.log("❌ Erreur lors du dépôt: " + error.message);
    }
  }

  /**
   * Affiche l'inventaire
   */
  showInventory(): void {
    if (!this.state.bot) return;

    const items = this.state.bot.inventory.items();

    if (items.length === 0) {
      this.logger.log("🎒 Inventaire vide.");
      return;
    }

    const inventorySummary: Record<string, number> = {};

    items.forEach((item) => {
      if (inventorySummary[item.displayName]) {
        inventorySummary[item.displayName] += item.count;
      } else {
        inventorySummary[item.displayName] = item.count;
      }
    });

    const textList = Object.entries(inventorySummary)
      .map(([name, count]) => `- ${name} x${count}`)
      .join("\n");

    this.logger.log(`🎒 Inventaire (${items.length} slots occupés) :\n${textList}`);
  }
}

