# 🔄 Démarrage automatique au boot

Guide pour configurer ExcaliaBot pour qu'il démarre automatiquement au démarrage de la machine Debian.

## 🚀 Méthode 1 : PM2 (Recommandé - Le plus simple)

PM2 gère automatiquement le démarrage au boot une fois configuré.

### 1. Démarrer l'application avec PM2

```bash
cd ~/excalia-bot
pm2 start ecosystem.config.cjs
```

### 2. Configurer le démarrage automatique

```bash
# Générer et configurer le script de démarrage
pm2 startup

# PM2 va afficher une commande à exécuter, par exemple :
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u administrateur --hp /home/administrateur

# COPIEZ ET EXÉCUTEZ cette commande affichée
```

### 3. Sauvegarder la configuration actuelle

```bash
# Sauvegarder la liste des applications en cours d'exécution
pm2 save
```

### 4. Vérifier

```bash
# Redémarrer la machine pour tester
sudo reboot

# Après le redémarrage, vérifier que PM2 a bien démarré
pm2 list
```

✅ **C'est tout !** PM2 redémarrera automatiquement vos applications à chaque boot.

### Commandes utiles PM2

```bash
# Voir la liste des applications qui démarreront au boot
pm2 list

# Mettre à jour le script de démarrage après des modifications
pm2 save

# Désactiver le démarrage automatique
pm2 unstartup systemd

# Voir les logs de démarrage
pm2 logs --lines 50
```

---

## 🛠️ Méthode 2 : Service Systemd (Alternative)

Pour plus de contrôle, vous pouvez créer un service systemd personnalisé.

### 1. Créer le fichier de service

```bash
sudo nano /etc/systemd/system/excalia-bot.service
```

Contenu du fichier :

```ini
[Unit]
Description=ExcaliaBot - Minecraft Bot Control Panel
Documentation=https://github.com/votre-repo
After=network.target

[Service]
Type=simple
User=administrateur
WorkingDirectory=/home/administrateur/excalia-bot
Environment=NODE_ENV=production
Environment=PATH=/usr/bin:/usr/local/bin

# Commande pour démarrer le backend
ExecStart=/usr/bin/node /home/administrateur/excalia-bot/bot.cjs

# Redémarrage automatique en cas de crash
Restart=always
RestartSec=10

# Limites de ressources
MemoryLimit=1G
CPUQuota=50%

# Logs
StandardOutput=journal
StandardError=journal
SyslogIdentifier=excalia-bot

[Install]
WantedBy=multi-user.target
```

### 2. Créer un second service pour le frontend

```bash
sudo nano /etc/systemd/system/excalia-bot-frontend.service
```

Contenu :

```ini
[Unit]
Description=ExcaliaBot Frontend (Vite)
After=network.target excalia-bot.service

[Service]
Type=simple
User=administrateur
WorkingDirectory=/home/administrateur/excalia-bot
Environment=NODE_ENV=production

# Commande pour démarrer le frontend
ExecStart=/usr/bin/npm run dev

# Redémarrage automatique
Restart=always
RestartSec=10

# Logs
StandardOutput=journal
StandardError=journal
SyslogIdentifier=excalia-bot-frontend

[Install]
WantedBy=multi-user.target
```

### 3. Recharger systemd et activer les services

```bash
# Recharger la configuration systemd
sudo systemctl daemon-reload

# Activer les services au démarrage
sudo systemctl enable excalia-bot.service
sudo systemctl enable excalia-bot-frontend.service

# Démarrer les services maintenant
sudo systemctl start excalia-bot.service
sudo systemctl start excalia-bot-frontend.service
```

### 4. Vérifier le statut

```bash
# Vérifier le statut des services
sudo systemctl status excalia-bot.service
sudo systemctl status excalia-bot-frontend.service

# Voir les logs
sudo journalctl -u excalia-bot.service -f
sudo journalctl -u excalia-bot-frontend.service -f
```

### Commandes utiles Systemd

```bash
# Démarrer
sudo systemctl start excalia-bot.service

# Arrêter
sudo systemctl stop excalia-bot.service

# Redémarrer
sudo systemctl restart excalia-bot.service

# Voir les logs
sudo journalctl -u excalia-bot.service -n 100

# Désactiver le démarrage automatique
sudo systemctl disable excalia-bot.service

# Recharger après modification du fichier .service
sudo systemctl daemon-reload
sudo systemctl restart excalia-bot.service
```

---

## 🔍 Comparaison des méthodes

| Critère | PM2 | Systemd |
|---------|-----|---------|
| **Simplicité** | ⭐⭐⭐⭐⭐ Très simple | ⭐⭐⭐ Moyen |
| **Monitoring** | ⭐⭐⭐⭐⭐ Interface web, CLI | ⭐⭐⭐ Journalctl |
| **Redémarrage auto** | ⭐⭐⭐⭐⭐ Natif | ⭐⭐⭐⭐⭐ Natif |
| **Logs** | ⭐⭐⭐⭐⭐ `pm2 logs` | ⭐⭐⭐⭐ `journalctl` |
| **Gestion multiple apps** | ⭐⭐⭐⭐⭐ Excellente | ⭐⭐⭐ Nécessite plusieurs services |
| **Natif Linux** | ⭐⭐⭐ Dépend de Node.js | ⭐⭐⭐⭐⭐ Natif |

**Recommandation** : Utilisez **PM2** sauf si vous avez des besoins spécifiques nécessitant systemd.

---

## 🧪 Test du démarrage automatique

### Avec PM2

```bash
# Sauvegarder la configuration
pm2 save

# Redémarrer la machine
sudo reboot

# Après redémarrage, se reconnecter et vérifier
pm2 list
pm2 logs
```

### Avec Systemd

```bash
# Redémarrer la machine
sudo reboot

# Après redémarrage, vérifier
sudo systemctl status excalia-bot.service
sudo systemctl status excalia-bot-frontend.service
```

---

## 🔧 Dépannage

### PM2 ne démarre pas au boot

```bash
# Vérifier que le script de démarrage existe
ls -la /etc/systemd/system/pm2-*

# Réinstaller le démarrage automatique
pm2 unstartup
pm2 startup
pm2 save

# Vérifier les permissions
pm2 ls
```

### Systemd ne démarre pas les services

```bash
# Vérifier les logs d'erreur
sudo journalctl -u excalia-bot.service -n 50 --no-pager

# Vérifier que le service est bien activé
sudo systemctl is-enabled excalia-bot.service

# Vérifier les permissions du fichier
ls -la /etc/systemd/system/excalia-bot.service

# Tester manuellement la commande
cd /home/administrateur/excalia-bot
node bot.cjs
```

### L'application ne répond pas après le boot

```bash
# Attendre quelques secondes après le boot (démarrage réseau)
sleep 10

# Vérifier que les services sont bien lancés
pm2 list
# ou
sudo systemctl status excalia-bot.service

# Vérifier les ports
sudo netstat -tlnp | grep -E '3000|8080'
```

---

## 📊 Monitoring après démarrage

### Avec PM2

```bash
# Interface temps réel
pm2 monit

# Dashboard web
pm2 web
# Accessible sur http://IP-SERVEUR:9615

# Logs en direct
pm2 logs --lines 100

# Statistiques
pm2 show excalia-bot-backend
```

### Avec Systemd

```bash
# Voir les logs en temps réel
sudo journalctl -u excalia-bot.service -f

# Voir les dernières entrées
sudo journalctl -u excalia-bot.service -n 100

# Voir les erreurs uniquement
sudo journalctl -u excalia-bot.service -p err
```

---

## ✅ Checklist de vérification

- [ ] PM2 ou Systemd configuré et activé
- [ ] Application démarre manuellement sans erreur
- [ ] Configuration sauvegardée (`pm2 save` ou service activé)
- [ ] Test de redémarrage effectué
- [ ] Logs vérifiés après redémarrage
- [ ] Ports accessibles (3000, 8080)
- [ ] Interface web accessible depuis un navigateur

---

## 🆘 Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs : `pm2 logs` ou `sudo journalctl -u excalia-bot.service`
2. Testez le démarrage manuel : `node bot.cjs`
3. Vérifiez les permissions : `ls -la ~/excalia-bot`
4. Vérifiez que Node.js est dans le PATH : `which node`

