const mineflayer = require("mineflayer");
require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

// --- CONFIGURATION WEB SERVER (GUI) ---
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const WEB_PORT = 3000;

// Servir la page dashboard.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "dashboard.html"));
});

// Fonction utilitaire pour envoyer des logs à la fois dans la console et sur le web
function log(message) {
  console.log(message); // Console Node.js standard
  io.emit("log", message); // Vers la page web
}

// Configuration du bot
const config = {
  host: process.env.SERVER_HOST || "localhost",
  port: parseInt(process.env.SERVER_PORT) || 61341,
  username: process.env.BOT_USERNAME || "ExcaliaBot",
  auth: process.env.AUTH_TYPE || "offline",
};

log("🚀 Démarrage du système...");

// --- LOGIQUE DU BOT ---
let bot;
let farmChasseurActive = false;
let farmChasseurInterval = null;
let nextAttackTime = 0;

function createBot() {
  bot = mineflayer.createBot({
    host: config.host,
    port: config.port,
    username: config.username,
    // version: "1.21.11",
    auth: config.auth,
  });

  initBotEvents();
}

function initBotEvents() {
  bot.on("login", () => {
    log("✅ Bot connecté au serveur avec succès!");
    io.emit("bot_connected", true);
    updateWebStatus();
  });

  bot.on("error", (err) => {
    log("❌ Erreur du bot: " + err.message);
  });

  bot.on("end", () => {
    log("👋 Bot déconnecté. Reconnexion dans 5s...");
    io.emit("bot_connected", false);
    setTimeout(createBot, 5000);
  });

  bot.on("health", () => updateWebStatus());
  bot.on("move", () => {
    /* Trop de spam si on log tout, on met juste à jour la variable interne si besoin */
  });

  // Écoute des MPs (gardé pour compatibilité in-game)
  bot.on("whisper", (username, message) => {
    if (username === bot.username) return;
    log(`🤫 MP de ${username}: ${message}`);
    // ... (votre logique de chat existante peut rester ici si souhaité)
  });
}

// Envoyer la santé et position au web régulièrement ou sur demande
function updateWebStatus() {
  if (!bot || !bot.entity) return;
  const pos = bot.entity.position;
  io.emit("status_update", {
    health: bot.health,
    pos: `X:${pos.x.toFixed(0)} Y:${pos.y.toFixed(0)} Z:${pos.z.toFixed(0)}`,
  });
}

// --- FONCTIONS ACTIONS ---

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

// --- GESTION DES COMMANDES SOCKET.IO (Depuis le Web) ---
io.on("connection", (socket) => {
  // Dès qu'on ouvre la page, on envoie l'état actuel
  socket.emit("bot_connected", bot && bot.entity);
  updateWebStatus();

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
      case "get_pos":
        updateWebStatus();
        log(`📍 Position: ${bot.entity.position}`);
        break;
      default:
        log("Commande inconnue: " + cmd);
    }
  });
});

// Lancement du serveur Web + Bot
server.listen(WEB_PORT, () => {
  console.log(
    `\n💻 INTERFACE GRAPHIQUE DISPONIBLE SUR: http://localhost:${WEB_PORT}`
  );
  console.log("---------------------------------------------------");
  createBot();
});
