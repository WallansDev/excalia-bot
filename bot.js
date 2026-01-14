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

// Variable pour gérer l'état du farm_chasseur
let farmChasseurActive = false;
let farmChasseurInterval = null;
let nextAttackTime = 0; // Cooldown global pour les attaques (en ms)

// Fonction pour exécuter une itération de farm
function executeFarmChasseur() {
  const center = bot.entity.position;
  const radius = 5;

  // Récupérer toutes les entités non-joueurs dans le rayon
  const nearbyMobs = Object.values(bot.entities).filter((entity) => {
    if (!entity || !entity.position) return false;
    if (entity.id === bot.entity.id) return false;
    if (entity.type === "player") return false;
    const distance = entity.position.distanceTo(center);
    return distance <= radius;
  });

  if (nearbyMobs.length === 0) {
    return; // Pas de mobs, on continue la boucle sans attaquer
  }

  // Choisir un seul mob (le plus proche) pour limiter les problèmes de désynchro
  nearbyMobs.sort((a, b) => {
    const da = a.position.distanceTo(center);
    const db = b.position.distanceTo(center);
    return da - db;
  });

  const target = nearbyMobs[0];
  if (!target) return;

  // Re-récupérer l'entité à partir de son id juste avant d'attaquer
  const current = bot.entities[target.id];
  if (!current || !current.position || !current.isValid) return;

  // Ne jamais attaquer un joueur
  if (current.type === "player") return;

  // Vérifier la distance réelle au moment de l'attaque (position actuelle du bot)
  const dist = current.position.distanceTo(bot.entity.position);
  if (dist > 3.0) return; // portée de mêlée sécurisée

  // Cooldown d'attaque pour laisser l'épée se recharger
  const now = Date.now();
  if (now < nextAttackTime) return;

  try {
    bot.attack(current);
    nextAttackTime = now + 600; // 0,6s de recharge
    console.log(
      `⚔️ Attaque d'un ${
        current.displayName || current.name || "mob"
      } (dist=${dist.toFixed(2)})`
    );
  } catch (err) {
    console.log("Erreur lors de l'attaque d'un mob:", err.message);
  }
}

bot.on("whisper", (username, message, rawMessage) => {
  if (username === bot.username) return;

  console.log(`🤫 MP de ${username}: ${message}`);

  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("pos")) {
    const pos = bot.entity.position;

    const reply = `ℹ️Ma position: X=${pos.x.toFixed(1)}, Y=${pos.y.toFixed(
      1
    )}, Z=${pos.z.toFixed(1)}`;

    bot.whisper(username, reply);
  }

  if (lowerMessage.includes("tpa")) {
    const pos = bot.entity.position;

    bot.whisper(username, "❓ Accepter ma demande de tp.");
    bot.chat(`/tp ${username}`);
  }

  // Démarrer le farm_chasseur
  if (
    lowerMessage.includes("farm_chasseur") &&
    !lowerMessage.includes("stop")
  ) {
    if (farmChasseurActive) {
      bot.whisper(username, "⚠️ Le farm_chasseur est déjà actif!");
      return;
    }

    farmChasseurActive = true;
    bot.whisper(
      username,
      "✅ Farm_chasseur démarré! Envoie 'farm_chasseur stop' pour arrêter."
    );

    // Exécuter immédiatement une première fois
    executeFarmChasseur();

    // Puis exécuter en boucle toutes les 2 secondes
    farmChasseurInterval = setInterval(() => {
      if (!farmChasseurActive) {
        clearInterval(farmChasseurInterval);
        return;
      }
      executeFarmChasseur();
    }, 2000); // 2 secondes entre chaque cycle de détection/attaque
  }

  // Arrêter le farm_chasseur
  if (lowerMessage.includes("farm_chasseur stop")) {
    if (!farmChasseurActive) {
      bot.whisper(username, "⚠️ Le farm_chasseur n'est pas actif!");
      return;
    }

    farmChasseurActive = false;
    if (farmChasseurInterval) {
      clearInterval(farmChasseurInterval);
      farmChasseurInterval = null;
    }
    bot.whisper(username, "🛑 Farm_chasseur arrêté!");
  }
});

bot.on("kicked", (reason, loggedIn) => {
  console.log("🚫 Bot expulsé du serveur!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // La raison peut être une chaîne simple ou un objet JSON
  let reasonText = reason;

  try {
    // Essayer de parser si c'est du JSON
    if (typeof reason === "string" && reason.startsWith("{")) {
      const parsed = JSON.parse(reason);
      reasonText =
        parsed.text || parsed.translate || JSON.stringify(parsed, null, 2);
    } else if (typeof reason === "object") {
      reasonText = JSON.stringify(reason, null, 2);
    }
  } catch (e) {
    // Si ce n'est pas du JSON, utiliser la raison telle quelle
    reasonText = reason;
  }

  console.log(`📋 Raison du kick: ${reasonText}`);
  console.log(`🔐 Était connecté: ${loggedIn ? "Oui" : "Non"}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
});

bot.on("banned", (reason) => {
  console.log("🔨 Bot banni du serveur!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // La raison peut être une chaîne simple ou un objet JSON
  let reasonText = reason;

  try {
    // Essayer de parser si c'est du JSON
    if (typeof reason === "string" && reason.startsWith("{")) {
      const parsed = JSON.parse(reason);
      reasonText =
        parsed.text || parsed.translate || JSON.stringify(parsed, null, 2);
    } else if (typeof reason === "object") {
      reasonText = JSON.stringify(reason, null, 2);
    }
  } catch (e) {
    // Si ce n'est pas du JSON, utiliser la raison telle quelle
    reasonText = reason;
  }

  console.log(`📋 Raison du ban: ${reasonText}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
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
