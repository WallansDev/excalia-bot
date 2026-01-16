const mineflayer = require("mineflayer");
require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

// --- CONFIGURATION WEB SERVER (GUI) ---
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:8080", "http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});
const WEB_PORT = 3000;

// Route de santé pour vérifier que le serveur fonctionne
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Bot server running" });
});

// Fonction utilitaire pour envoyer des logs à la fois dans la console et sur le web
function log(message) {
  console.log(message); // Console Node.js standard
  io.emit("log", message); // Vers la page web
}

log("🚀 Démarrage du système...");

// --- LOGIQUE DU BOT ---
let bot;
let farmChasseurActive = false;
let farmChasseurInterval = null;
let nextAttackTime = 0;

function connectBot(botConfig) {
  // Si un bot est déjà connecté, on le déconnecte d'abord
  if (bot) {
    disconnectBot();
  }

  log(`🔌 Connexion au serveur ${botConfig.host}:${botConfig.port}...`);

  const botOptions = {
    host: botConfig.host,
    port: botConfig.port,
    username: botConfig.username,
    // version: "1.21.11",
    auth: botConfig.auth || "offline",
  };

  // Gestion de l'authentification Microsoft avec callback pour le lien de validation
  if (botConfig.auth === "microsoft") {
    botOptions.onMsaCode = (data) => {
      const message =
        `🔐 Authentification Microsoft requise\n\n` +
        `Veuillez ouvrir ce lien dans votre navigateur :\n${data.verification_uri}\n\n` +
        `Code de vérification : ${data.user_code}\n\n` +
        `Une fois authentifié, la connexion se poursuivra automatiquement.`;

      log(message);

      // Envoyer un événement spécial pour afficher le lien dans un pop-up
      io.emit("msa_code", {
        verification_uri: data.verification_uri,
        user_code: data.user_code,
        message: data.message || "Veuillez vous authentifier avec Microsoft",
      });
    };
  }

  try {
    bot = mineflayer.createBot(botOptions);
    initBotEvents();
  } catch (err) {
    log("❌ Erreur lors de la création du bot: " + err.message);
    io.emit("bot_connected", false);
    bot = null;
  }
}

function disconnectBot() {
  if (!bot) {
    log("⚠️ Aucun bot à déconnecter.");
    return;
  }

  // Arrêter le farm si actif
  if (farmChasseurActive) {
    stopFarm();
  }

  log("👋 Déconnexion du bot...");
  bot.end();
  bot = null;
  io.emit("bot_connected", false);
}

function initBotEvents() {
  bot.on("login", () => {
    log("✅ Bot connecté au serveur avec succès!");
    io.emit("bot_connected", true);
    updateWebStatus();
  });

  bot.on("experience", () => {
    updateWebStatus(); // Met à jour le site web quand l'XP change
  });

  bot.on("error", (err) => {
    let errorMessage = "❌ Erreur du bot: " + err.message;
    let advice = "";

    // Gestion des erreurs courantes avec conseils
    if (err.code === "ECONNRESET") {
      errorMessage = "❌ Connexion réinitialisée par le serveur";
      advice =
        "\n💡 Conseils:\n" +
        "- Vérifiez que le serveur est en ligne et accessible\n" +
        "- Vérifiez que le port est correct\n" +
        "- Le serveur peut avoir rejeté la connexion (whitelist, bannissement)\n" +
        "- Vérifiez votre connexion internet";
    } else if (err.code === "ETIMEDOUT" || err.code === "ENOTFOUND") {
      errorMessage = "❌ Impossible de se connecter au serveur";
      advice =
        "\n💡 Conseils:\n" +
        "- Vérifiez l'adresse du serveur (host)\n" +
        "- Vérifiez que le serveur est accessible depuis votre réseau\n" +
        "- Vérifiez votre connexion internet";
    } else if (err.code === "ECONNREFUSED") {
      errorMessage = "❌ Connexion refusée par le serveur";
      advice =
        "\n💡 Conseils:\n" +
        "- Le serveur n'accepte peut-être pas de nouvelles connexions\n" +
        "- Vérifiez que le port est correct\n" +
        "- Le serveur peut être en maintenance";
    } else if (err.message && err.message.includes("Invalid session")) {
      errorMessage = "❌ Session invalide";
      advice =
        "\n💡 Conseils:\n" +
        "- Vérifiez vos identifiants Microsoft si vous utilisez l'authentification Microsoft\n" +
        "- Réessayez de vous connecter";
    }

    log(errorMessage + advice);
    io.emit("bot_connected", false);
  });

  bot.on("end", () => {
    log("👋 Bot déconnecté.");
    io.emit("bot_connected", false);
    bot = null;
  });

  bot.on("kicked", (reason, loggedIn) => {
    const reasonText =
      typeof reason === "string" ? reason : JSON.stringify(reason);
    log(`🚫 Bot expulsé du serveur: ${reasonText}`);
    io.emit("bot_connected", false);
  });

  bot.on("health", () => updateWebStatus());
  bot.on("move", () => {
    /* Trop de spam si on log tout, on met juste à jour la variable interne si besoin */
  });
}

// Envoyer la santé et position au web régulièrement ou sur demande
function updateWebStatus() {
  if (!bot || !bot.entity) return;
  const pos = bot.entity.position;

  io.emit("status_update", {
    health: bot.health,
    pos: `X:${pos.x.toFixed(0)} Y:${pos.y.toFixed(0)} Z:${pos.z.toFixed(0)}`,
    // Ajout des données d'XP
    xp: {
      level: bot.experience.level, // Niveau global (ex: 30)
      progress: bot.experience.progress, // Progression vers le prochain niveau (0.0 à 1.0)
    },
  });
}

// 1. Logique Farm Chasseur
function startFarm() {
  if (farmChasseurActive) {
    log("⚠️ Le farm est déjà actif.");
    return;
  }
  farmChasseurActive = true;
  log("⚔️ Farm Chasseur ACTIVÉ");

  executeFarmChasseur(); // Premier coup immédiat
  farmChasseurInterval = setInterval(() => {
    if (!farmChasseurActive) {
      clearInterval(farmChasseurInterval);
      return;
    }
    executeFarmChasseur();
  }, 2000);
}

function stopFarm() {
  if (!farmChasseurActive) {
    log("⚠️ Le farm n'est pas actif.");
    return;
  }
  farmChasseurActive = false;
  if (farmChasseurInterval) clearInterval(farmChasseurInterval);
  log("🛑 Farm Chasseur ARRÊTÉ");
}

function executeFarmChasseur() {
  if (!bot || !bot.entity) return;
  const center = bot.entity.position;
  const radius = 5;

  // Récupération des mobs
  const nearbyMobs = Object.values(bot.entities).filter((entity) => {
    if (!entity || !entity.position) return false;
    if (entity.id === bot.entity.id) return false;
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
  if (now < nextAttackTime) return;

  const current = bot.entities[target.id];
  if (!current || !current.position) return;

  const dist = current.position.distanceTo(bot.entity.position);
  if (dist > 3.5) return;

  const lookPos = current.position.offset(0, current.height ?? 1.2, 0);

  bot
    .lookAt(lookPos, true)
    .then(() => {
      if (!bot.entities[target.id]) return; // Mob disparu
      try {
        bot.attack(current);
        nextAttackTime = Date.now() + 600;
        log(
          `⚔️ Coup porté sur ${
            current.displayName || current.name
          } (dist: ${dist.toFixed(1)})`
        );
      } catch (err) {
        // Ignorer les petites erreurs d'attaque
      }
    })
    .catch((err) => {});
}

// 2. Logique Inventaire
async function dumpInventory() {
  if (!bot) return;
  log("📦 Recherche d'un coffre...");

  const chestBlock = bot.findBlock({
    matching: (block) =>
      block && ["chest", "trapped_chest", "barrel"].includes(block.name),
    maxDistance: 4,
  });

  if (!chestBlock) {
    log("❌ Aucun coffre trouvé à proximité.");
    return;
  }

  try {
    const chest = await bot.openChest(chestBlock);
    log("📂 Coffre ouvert. Dépôt en cours...");

    const items = bot.inventory.items();
    for (const item of items) {
      try {
        await chest.deposit(item.type, null, item.count);
        log(`> Déposé: ${item.name} x${item.count}`);
      } catch (err) {
        // Erreur mineure item
      }
    }
    chest.close();
    log("✅ Inventaire vidé avec succès.");
  } catch (err) {
    log("❌ Erreur lors du dépôt: " + err.message);
  }
}

function showInventory() {
  if (!bot) return;

  const items = bot.inventory.items();

  if (items.length === 0) {
    log("🎒 Inventaire vide.");
    return;
  }

  const inventorySummary = {};

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

  log(`🎒 Inventaire (${items.length} slots occupés) :\n${textList}`);
}

// --- GESTION DES COMMANDES SOCKET.IO (Depuis le Web) ---
io.on("connection", (socket) => {
  // Dès qu'on ouvre la page, on envoie l'état actuel
  socket.emit("bot_connected", bot && bot.entity);
  updateWebStatus();

  // Gestion de la connexion du bot
  socket.on("connect_bot", (botConfig) => {
    try {
      // Validation des données
      if (!botConfig.host || !botConfig.port || !botConfig.username) {
        socket.emit("log", "❌ Veuillez remplir tous les champs requis.");
        return;
      }

      const port = parseInt(botConfig.port);
      if (isNaN(port) || port < 1 || port > 65535) {
        socket.emit("log", "❌ Le port doit être un nombre entre 1 et 65535.");
        return;
      }

      connectBot({
        host: botConfig.host.trim(),
        port: port,
        username: botConfig.username.trim(),
        auth: botConfig.auth || "offline",
      });
    } catch (err) {
      log("❌ Erreur lors de la connexion: " + err.message);
      socket.emit("log", "❌ Erreur lors de la connexion: " + err.message);
    }
  });

  // Gestion de la déconnexion du bot
  socket.on("disconnect_bot", () => {
    disconnectBot();
  });

  // Gestion de la téléportation
  socket.on("teleport_to", (username) => {
    if (!bot) {
      socket.emit("log", "❌ Le bot n'est pas connecté.");
      return;
    }

    // Sécurité basique pour éviter d'injecter n'importe quoi
    const cleanUsername = username.trim();

    if (cleanUsername) {
      log(`🚀 Téléportation vers : ${cleanUsername}`);
      bot.chat(`/tpa ${cleanUsername}`);
    }
  });

  // Réception des clics boutons
  socket.on("command", (cmd) => {
    if (!bot) {
      socket.emit("log", "❌ Le bot n'est pas initialisé.");
      return;
    }

    switch (cmd) {
      case "start_farm":
        startFarm();
        break;
      case "stop_farm":
        stopFarm();
        break;
      case "dump_inventory":
        dumpInventory();
        break;
      case "show_inventory":
        showInventory();
        break;
      case "get_pos":
        updateWebStatus();
        log(`📍 Position: ${bot.entity.position}`);
        break;
      default:
        log("Commande inconnue: " + cmd);
    }
  });
});

// Lancement du serveur Web (sans connexion automatique du bot)
server.listen(WEB_PORT, () => {
  console.log(
    `\n💻 INTERFACE GRAPHIQUE DISPONIBLE SUR: http://localhost:${WEB_PORT}`
  );
  console.log("---------------------------------------------------");
  log("⏳ En attente de connexion du bot depuis l'interface web...");
});
