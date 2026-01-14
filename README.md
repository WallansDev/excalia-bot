# Excalia Bot - Bot Minecraft

Un bot Minecraft compatible avec la version 1.21.11 qui peut se connecter à un serveur Minecraft.

## 🚀 Installation

1. **Installer Node.js**
   - Assurez-vous d'avoir Node.js installé (version 14 ou supérieure)
   - Téléchargez-le depuis [nodejs.org](https://nodejs.org/)

2. **Installer les dépendances**
   ```bash
   npm install
   ```

## ⚙️ Configuration

1. **Copier le fichier de configuration**
   ```bash
   copy .env.example .env
   ```
   (Sur Linux/Mac: `cp .env.example .env`)

2. **Modifier le fichier `.env`** avec vos paramètres:
   ```
   SERVER_HOST=localhost          # Adresse du serveur
   SERVER_PORT=25565              # Port du serveur
   BOT_USERNAME=ExcaliaBot        # Nom du bot
   AUTH_TYPE=offline              # Type d'authentification
   ```

## 🎮 Utilisation

### Lancer le bot
```bash
npm start
```

ou

```bash
node bot.js
```

### Connexion à un serveur local (LAN)

Si vous voulez tester le bot sur un serveur local:

1. Ouvrez Minecraft en solo
2. Appuyez sur `Échap` puis sélectionnez "Ouvrir au LAN"
3. Notez le port affiché (par exemple: 54321)
4. Modifiez `SERVER_PORT` dans le fichier `.env` avec ce port
5. Lancez le bot

### Connexion à un serveur en ligne

1. Modifiez `SERVER_HOST` dans le fichier `.env` avec l'adresse du serveur
2. Modifiez `SERVER_PORT` si nécessaire (par défaut: 25565)
3. Lancez le bot

## 📋 Fonctionnalités

- ✅ Connexion automatique au serveur
- ✅ Réponses automatiques dans le chat
- ✅ Commandes simples (!help, !pos, !ping)
- ✅ Gestion des erreurs et reconnexion
- ✅ Compatible avec Minecraft 1.21.11

## 🎯 Commandes disponibles

Une fois connecté, vous pouvez utiliser ces commandes dans le chat:

- `!help` - Affiche l'aide
- `!pos` - Affiche la position du bot
- `!ping` - Test de connexion

Le bot répondra également automatiquement aux messages contenant "bonjour" ou "salut".

## 🔧 Authentification Microsoft

Pour utiliser l'authentification Microsoft:

1. Modifiez `AUTH_TYPE=microsoft` dans le fichier `.env`
2. Assurez-vous que l'email utilisé pour `BOT_USERNAME` peut se connecter à minecraft.net via "Login with Microsoft"

## 📝 Notes

- Le bot fonctionne en mode "offline" par défaut (pas besoin de compte Minecraft)
- Pour les serveurs en ligne, vérifiez que le serveur accepte les connexions en mode offline
- Le bot se reconnectera automatiquement en cas de déconnexion (relancez le script)

## 🐛 Dépannage

**Erreur: "ENOTFOUND"**
- Vérifiez que l'adresse du serveur est correcte

**Erreur: "ECONNREFUSED"**
- Vérifiez que le serveur est en cours d'exécution
- Vérifiez que le port est correct

**Le bot ne répond pas**
- Vérifiez que le bot est bien connecté (message "Bot connecté au serveur")
- Vérifiez les permissions du bot sur le serveur

## 📄 Licence

MIT

