# Architecture TypeScript - Excalia Bot

## 📁 Structure du projet

```
excalia-bot/
├── src/
│   ├── index.ts              # Point d'entrée principal
│   ├── types/
│   │   └── index.ts          # Types et interfaces TypeScript
│   ├── bot/
│   │   └── botManager.ts      # Gestionnaire du bot Minecraft
│   ├── server/
│   │   ├── webServer.ts      # Serveur web Express
│   │   └── socketHandler.ts  # Gestionnaire Socket.IO
│   └── utils/
│       ├── logger.ts          # Utilitaire de logging
│       └── errorHandler.ts    # Gestionnaire d'erreurs
├── dist/                      # Fichiers compilés (généré)
├── dashboard.html             # Interface web
├── tsconfig.json              # Configuration TypeScript
└── package.json
```

## 🚀 Installation

1. Installer les dépendances :
```bash
npm install
```

2. Compiler le projet :
```bash
npm run build
```

3. Lancer l'application :
```bash
npm start
```

## 💻 Développement

Pour le développement avec recompilation automatique :
```bash
npm run dev
```

Pour compiler en mode watch (recompilation automatique) :
```bash
npm run watch
```

## 📦 Importation de fichiers

L'architecture est conçue pour faciliter l'importation de vos propres fichiers. Voici comment importer les modules principaux :

### Exemple 1 : Importer le BotManager

```typescript
import { BotManager } from './bot/botManager';
import { Logger } from './utils/logger';
import { ErrorHandler } from './utils/errorHandler';
import { Server as SocketIOServer } from 'socket.io';

// Créer vos instances
const logger = new Logger(io);
const errorHandler = new ErrorHandler(logger);
const botManager = new BotManager(logger, errorHandler, io);

// Utiliser le bot manager
botManager.connectBot({
  host: 'localhost',
  port: 25565,
  username: 'MonBot',
  auth: 'offline'
});
```

### Exemple 2 : Créer un nouveau module

Créez un nouveau fichier dans `src/` :

```typescript
// src/features/myFeature.ts
import { BotManager } from '../bot/botManager';
import { Logger } from '../utils/logger';

export class MyFeature {
  constructor(
    private botManager: BotManager,
    private logger: Logger
  ) {}

  doSomething(): void {
    const bot = this.botManager.getBot();
    if (bot) {
      this.logger.log('Bot disponible !');
    }
  }
}
```

Puis importez-le dans `src/index.ts` :

```typescript
import { MyFeature } from './features/myFeature';

// Utiliser votre feature
const myFeature = new MyFeature(webServer.getBotManager(), webServer.getLogger());
myFeature.doSomething();
```

### Exemple 3 : Utiliser les types

```typescript
import { BotConfig, StatusUpdate, MsaCodeData } from './types';

function connectToServer(config: BotConfig): void {
  // Votre logique
}

function handleStatusUpdate(status: StatusUpdate): void {
  console.log(`Health: ${status.health}`);
  console.log(`Position: ${status.pos}`);
  console.log(`Level: ${status.xp.level}`);
}
```

## 🔧 Configuration TypeScript

Le fichier `tsconfig.json` est configuré avec :
- **Strict mode** activé pour une meilleure sécurité de types
- **Source maps** pour le debugging
- **Déclarations** pour générer les fichiers `.d.ts`
- **Module resolution** Node.js

## 📝 Types disponibles

Tous les types sont exportés depuis `src/types/index.ts` :

- `BotConfig` : Configuration pour la connexion du bot
- `MsaCodeData` : Données d'authentification Microsoft
- `StatusUpdate` : Données de statut du bot
- `WebServerConfig` : Configuration du serveur web
- `BotState` : État global du bot

## 🎯 Bonnes pratiques

1. **Toujours typer vos fonctions et variables**
2. **Utiliser les interfaces plutôt que les types primitifs**
3. **Importer depuis les modules plutôt que d'utiliser require()**
4. **Utiliser les classes exportées plutôt que de modifier directement les fichiers**

## 🐛 Résolution de problèmes

Si vous rencontrez des erreurs de compilation :
1. Vérifiez que tous les types sont correctement importés
2. Assurez-vous que `npm install` a bien installé `@types/node` et `@types/express`
3. Vérifiez que `tsconfig.json` est correctement configuré

