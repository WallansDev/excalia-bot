# 🚀 Guide de démarrage - ExcaliaBot

## Installation

1. Installer les dépendances nécessaires :
```bash
npm install socket.io-client
```

## Lancement de l'application

L'application fonctionne avec **deux serveurs** qui doivent tourner simultanément :

### 1. Serveur Backend (bot.cjs) - Port 3000
Dans un premier terminal :
```bash
node bot.cjs
```

Ce serveur gère :
- La connexion au serveur Minecraft
- La logique du bot (farm, inventaire, etc.)
- Le serveur Socket.IO pour la communication avec le frontend

### 2. Serveur Frontend (Vite + React) - Port 8080
Dans un second terminal :
```bash
npm run dev
```

Ce serveur sert l'interface web React.

## Accès à l'application

Une fois les deux serveurs lancés :
- **Interface Web** : http://localhost:8080
- **API Backend** : http://localhost:3000

## Architecture

```
┌─────────────────────────────────────────┐
│   Frontend (React + Vite)              │
│   Port 8080 (index.html)                │
│                                          │
│   - Interface utilisateur               │
│   - Composants React                    │
│   - Hook useSocket                      │
└─────────────┬───────────────────────────┘
              │
              │ Socket.IO (websocket)
              │
┌─────────────▼───────────────────────────┐
│   Backend (bot.cjs)                     │
│   Port 3000                              │
│                                          │
│   - Serveur Express                     │
│   - Socket.IO server                    │
│   - Bot Mineflayer                      │
│   - Logique du bot                      │
└─────────────┬───────────────────────────┘
              │
              │ Protocole Minecraft
              │
┌─────────────▼───────────────────────────┐
│   Serveur Minecraft                     │
└─────────────────────────────────────────┘
```

## Communication

Le frontend communique avec le backend via Socket.IO :

### Événements envoyés par le frontend :
- `connect_bot` : Se connecter au serveur Minecraft
- `disconnect_bot` : Se déconnecter
- `command` : Envoyer une commande (start_farm, stop_farm, etc.)
- `teleport_to` : Se téléporter vers un joueur

### Événements reçus par le frontend :
- `bot_connected` : État de connexion du bot
- `status_update` : Mise à jour de la santé, position, XP
- `log` : Messages de log
- `msa_code` : Code d'authentification Microsoft

## Fonctionnalités

✅ Connexion/Déconnexion du bot  
✅ Farm automatique de chasseur  
✅ Gestion d'inventaire  
✅ Téléportation vers joueurs  
✅ Authentification Microsoft  
✅ Console en temps réel  
✅ Interface moderne avec React

## Dépannage

### Le frontend ne se connecte pas au backend
- Vérifiez que bot.cjs tourne sur le port 3000
- Vérifiez que le proxy Vite est configuré dans `vite.config.ts`

### Erreur CORS
- Les CORS sont configurés dans bot.cjs pour accepter localhost:8080
- Vérifiez que les deux serveurs utilisent les bons ports

### Erreur "require is not defined"
- Le fichier backend est maintenant `bot.cjs` (CommonJS) au lieu de `bot.js`
- Utilisez `node bot.cjs` pour le lancer

### Le bot ne se connecte pas au serveur Minecraft
- Vérifiez l'adresse et le port du serveur
- Vérifiez que le serveur est accessible
- Consultez les logs dans la console du frontend

