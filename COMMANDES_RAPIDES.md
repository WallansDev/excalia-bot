# ⚡ Commandes rapides - Debian

## 🔧 Sur Debian, renommer les fichiers

```bash
# Aller dans le dossier du projet
cd ~/excalia-bot

# Renommer les fichiers problématiques
mv ecosystem.config.js ecosystem.config.cjs 2>/dev/null || true
mv bot.js bot.cjs 2>/dev/null || true
```

## 🚀 Démarrage

### Avec PM2 (recommandé)
```bash
# Installer PM2 si nécessaire
sudo npm install -g pm2

# Démarrer
pm2 start ecosystem.config.cjs

# Voir le statut
pm2 status

# Voir les logs
pm2 logs

# Arrêter
pm2 stop all
```

### Manuel (deux terminaux)
```bash
# Terminal 1 - Backend
node bot.cjs

# Terminal 2 - Frontend
npm run dev
```

## 📋 Commandes utiles

```bash
# Vérifier les processus
pm2 list

# Logs en temps réel
pm2 logs --lines 100

# Redémarrer
pm2 restart all

# Arrêter
pm2 stop all

# Supprimer de la liste PM2
pm2 delete all

# Sauvegarder la configuration
pm2 save

# Démarrage automatique au boot
pm2 startup
# Exécutez la commande affichée, puis :
pm2 save
```

## 🔍 Debug

```bash
# Vérifier les ports
sudo netstat -tlnp | grep -E '3000|8080'

# Tester le backend
curl http://localhost:3000/health

# Tester le frontend
curl http://localhost:8080

# Voir les logs Node.js
tail -f logs/backend.log
tail -f logs/frontend.log
```

## 🌐 Accès

```bash
# Local
http://localhost:8080

# Distant
http://IP-DU-SERVEUR:8080
```

