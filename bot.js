const mineflayer = require("mineflayer");
require("dotenv").config();

// Configuration du bot depuis les variables d'environnement ou valeurs par défaut
const config = {
  host: process.env.SERVER_HOST || "localhost",
  port: parseInt(process.env.SERVER_PORT) || 61341,
  username: process.env.BOT_USERNAME || "ExcaliaBot",
  // version: "1.21.11",
  auth: process.env.AUTH_TYPE || "offline", // 'offline' ou 'microsoft'
};

console.log("🚀 Démarrage du bot Minecraft...");
console.log(`📡 Connexion à ${config.host}:${config.port}`);
console.log(`👤 Nom d'utilisateur: ${config.username}`);
console.log(`🎮 Version: ${config.version}`);

// Création du bot
const bot = mineflayer.createBot({
  host: config.host,
  port: config.port,
  username: config.username,
  version: config.version,
  auth: config.auth,
});

// Événement: Connexion réussie
bot.on("login", () => {
  console.log("✅ Bot connecté au serveur avec succès!");
  console.log(`📍 Position: ${bot.entity.position}`);
});

// Événement: Erreur de connexion
bot.on("error", (err) => {
  console.error("❌ Erreur du bot:", err.message);
  if (err.code === "ENOTFOUND") {
    console.error(
      "⚠️  Impossible de trouver le serveur. Vérifiez l'adresse du serveur."
    );
  } else if (err.code === "ECONNREFUSED") {
    console.error(
      "⚠️  Connexion refusée. Vérifiez que le serveur est en cours d'exécution."
    );
  }
});

// Événement: Déconnexion
bot.on("end", () => {
  console.log("👋 Bot déconnecté du serveur.");
  console.log("🔄 Reconnexion dans 5 secondes...");
  setTimeout(() => {
    console.log("🔄 Tentative de reconnexion...");
    // Le bot se reconnectera automatiquement si vous relancez le script
  }, 5000);
});

bot.on("whisper", (username, message, rawMessage) => {
  if (username === bot.username) return;

  console.log(`🤫 MP de ${username}: ${message}`);

  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("pos")) {
    const pos = bot.entity.position;

    const reply = `ℹ️ Ma position: X=${pos.x.toFixed(1)}, Y=${pos.y.toFixed(
      1
    )}, Z=${pos.z.toFixed(1)}`;

    bot.whisper(username, reply);
  }

  if (lowerMessage.includes("tpa")) {
    const pos = bot.entity.position;

    bot.whisper(username, "ℹ️ Accepter ma demande de tp.");
    bot.chat(`/tpa ${username}`);
  }
});

bot.on("kicked", (reason, loggedIn) => {
  console.log(`🚫 Bot expulsé: ${reason}`);
});

bot.on("banned", (reason) => {
  console.log(`🔨 Bot banni: ${reason}`);
});

bot.on("health", () => {
  if (bot.health < 5) {
    console.log(`⚠️  Santé faible: ${bot.health}/20`);
  }
});

bot.on("death", () => {
  console.log("💀 Le bot est mort!");
});

bot.on("entitySpawn", (entity) => {
  if (entity.name === "player") {
    console.log(`👤 Joueur ${entity.username} a rejoint le serveur`);
  }
});

process.on("unhandledRejection", (err) => {
  console.error("❌ Erreur non gérée:", err);
});

process.on("SIGINT", () => {
  console.log("\n🛑 Arrêt du bot...");
  bot.quit("Arrêt manuel");
  process.exit(0);
});

console.log("✅ Bot initialisé. En attente de connexion...");
