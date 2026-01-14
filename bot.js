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

  // Récupérer toutes les entités non-joueurs dans le rayon,
  // mais uniquement les entités considérées comme mobs vivants (hostiles / passifs), pas les orbes, projectiles, etc.
  const nearbyMobs = Object.values(bot.entities).filter((entity) => {
    if (!entity || !entity.position) return false;
    if (entity.id === bot.entity.id) return false;
    if (entity.type === "player") return false;

    // Stratégie plus permissive : on accepte si
    // - type === "mob"
    // - ou kind contient "mob"
    // - ou l'entité a un displayName (souvent le cas des mobs) et n'est pas dans la liste invalide
    const isMobType = entity.type === "mob";
    const isMobKind =
      typeof entity.kind === "string" &&
      entity.kind.toLowerCase().includes("mob");
    const hasDisplay = Boolean(entity.displayName);
    if (!isMobType && !isMobKind && !hasDisplay) return false;

    // Filtrer explicitement quelques entités non vivantes au cas où
    const invalidNames = ["experience_orb", "xp_orb", "item", "arrow"];
    if (invalidNames.includes(entity.name)) return false;

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

  // Cooldown d'attaque pour laisser l'épée se recharger
  const now = Date.now();
  if (now < nextAttackTime) return;

  // Re-récupérer l'entité à partir de son id pour avoir sa position actuelle
  const current = bot.entities[target.id];
  if (!current || !current.position || !current.isValid) return;

  // Vérifier la distance réelle au moment de l'attaque (position actuelle du bot)
  const dist = current.position.distanceTo(bot.entity.position);
  if (dist > 3.0) return; // portée de mêlée sécurisée

  // Tourner la caméra vers la tête du mob (position actuelle, pas celle du spawn)
  const lookPos = current.position.offset(0, current.height ?? 1.2, 0);

  try {
    // Tourner vers la cible d'abord
    bot.lookAt(lookPos, true);

    // Attendre que la rotation soit terminée avant d'attaquer
    setTimeout(() => {
      // Re-vérifier une dernière fois que l'entité est toujours valide
      const checkTarget = bot.entities[target.id];
      if (!checkTarget || !checkTarget.isValid) {
        console.log("⚠️ Cible invalide après rotation");
        return;
      }

      const now2 = Date.now();
      if (now2 < nextAttackTime) {
        console.log("⚠️ Cooldown pas encore écoulé");
        return;
      }

      // Re-vérifier la distance une dernière fois
      const finalDist = checkTarget.position.distanceTo(bot.entity.position);
      if (finalDist > 3.0) {
        console.log(`⚠️ Distance trop grande: ${finalDist.toFixed(2)}`);
        return;
      }

      try {
        bot.attack(checkTarget);
        nextAttackTime = now2 + 600; // 0,6s de recharge
        console.log(
          `⚔️ Attaque d'un ${
            checkTarget.displayName || checkTarget.name || "mob"
          } (dist=${finalDist.toFixed(2)})`
        );
      } catch (err) {
        console.log("❌ Erreur lors de l'attaque d'un mob:", err.message);
      }
    }, 100); // 100ms pour laisser le temps au bot de tourner complètement
  } catch (err) {
    console.log("❌ Erreur lors du lookAt avant attaque:", err.message);
  }
}

// Fonctions utilitaires pour gérer les coffres
async function openChestAsync(block) {
  // Depuis mineflayer v4+, openChest renvoie une Promise qui se résout
  // avec l'objet Chest quand l'inventaire est prêt.
  return bot.openChest(block);
}

bot.on("whisper", async (username, message, rawMessage) => {
  if (username === bot.username) return;

  console.log(`🤫 MP de ${username}: ${message}`);

  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("!help")) {
    const reply = `ℹ️ Commandes disponibles: !pos, !tpa, !farm_chasseur, !inventory`;

    bot.whisper(username, reply);
  }

  if (lowerMessage.includes("!pos")) {
    const pos = bot.entity.position;

    const reply = `ℹ️Ma position: X=${pos.x.toFixed(1)}, Y=${pos.y.toFixed(
      1
    )}, Z=${pos.z.toFixed(1)}`;

    bot.whisper(username, reply);
  }

  if (lowerMessage.includes("!tpa")) {
    const pos = bot.entity.position;

    bot.whisper(username, "❓ Accepter ma demande de tp.");
    bot.chat(`/tp ${username}`);
  }

  // Démarrer le farm_chasseur
  if (
    lowerMessage.includes("!farm_chasseur") &&
    !lowerMessage.includes("_stop")
  ) {
    if (farmChasseurActive) {
      bot.whisper(username, "⚠️ Le farm_chasseur est déjà actif!");
      return;
    }

    farmChasseurActive = true;
    bot.whisper(
      username,
      "✅ Farm_chasseur démarré! Envoie 'farm_chasseur_stop' pour arrêter."
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
  if (lowerMessage.includes("farm_chasseur_stop")) {
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

  if (lowerMessage.includes("inventory")) {
    // Cliquer sur le coffre le plus proche (moins de 3 blocks)
    const chestBlock = bot.findBlock({
      matching: (block) =>
        block &&
        (block.name === "chest" ||
          block.name === "trapped_chest" ||
          block.name === "barrel"),
      maxDistance: 3,
    });

    if (!chestBlock) {
      bot.whisper(
        username,
        "❌ Aucun coffre ou baril trouvé à moins de 3 blocs."
      );
      return;
    }

    try {
      const chest = await openChestAsync(chestBlock);

      // Vider son inventaire dans le coffre
      const items = bot.inventory.items();
      for (const item of items) {
        try {
          // Rechercher l'item encore présent dans l'inventaire
          const current = bot.inventory
            .items()
            .find((i) => i.type === item.type);

          // Si l'item n'est plus présent (déjà déposé / déplacé), on passe au suivant
          if (!current) continue;

          await chest.deposit(current.type, null, current.count);
        } catch (err) {
          console.log(
            `Erreur lors du dépôt de ${item.displayName}:`,
            err.message
          );
        }
      }

      // Quitter affichage coffre
      chest.close();

      // Envoyer message de réussite
      bot.whisper(
        username,
        "✅ Inventaire vidé dans le coffre le plus proche."
      );
    } catch (err) {
      console.log("Erreur lors de la gestion de l'inventaire:", err);
      bot.whisper(
        username,
        "❌ Impossible de vider l'inventaire dans le coffre."
      );
    }
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
