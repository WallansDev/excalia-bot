# 🐧 Installation sur Debian 13

Guide complet pour installer et exécuter ExcaliaBot sur Debian 13.

## 📋 Prérequis

### 1. Installer Node.js (v18 ou supérieur)

```bash
# Mettre à jour le système
sudo apt update
sudo apt upgrade -y

# Installer curl si nécessaire
sudo apt install -y curl

# Installer Node.js via NodeSource (recommandé)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Vérifier l'installation
node --version  # Devrait afficher v20.x.x
npm --version   # Devrait afficher 10.x.x
```

### 2. Installer Git (si nécessaire)

```bash
sudo apt install -y git
```

## 📦 Installation de l'application

### 1. Cloner ou transférer le projet

**Option A : Depuis Git**
```bash
git clone <votre-repo> excalia-bot
cd excalia-bot
```

**Option B : Transférer depuis Windows**
```bash
# Sur Windows (PowerShell)
scp -r C:\Users\Wallans\Desktop\excalia-bot user@debian-server:/home/user/

# Sur Debian
cd /home/user/excalia-bot
```

### 2. Installer les dépendances

```bash
# Installer toutes les dépendances (frontend + backend)
npm install

# Installer les dépendances spécifiques au backend
npm install mineflayer express socket.io dotenv
```

## 🚀 Lancement de l'application

### Option 1 : Développement (deux terminaux)

**Terminal 1 : Backend**
```bash
cd /home/user/excalia-bot
node bot.cjs
```

**Terminal 2 : Frontend**
```bash
cd /home/user/excalia-bot
npm run dev
```

Accès :
- Frontend : `http://IP-SERVEUR:8080`
- Backend : `http://IP-SERVEUR:3000`

### Option 2 : Production avec PM2 (recommandé)

PM2 permet de gérer les processus Node.js de manière persistante.

#### Installation de PM2

```bash
sudo npm install -g pm2
```

#### Créer un fichier de configuration PM2

```bash
nano ecosystem.config.cjs
```

Contenu du fichier :

```javascript
module.exports = {
  apps: [
    {
      name: 'excalia-bot-backend',
      script: './bot.cjs',
      cwd: '/home/user/excalia-bot',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
    },
    {
      name: 'excalia-bot-frontend',
      script: 'npm',
      args: 'run dev',
      cwd: '/home/user/excalia-bot',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
    },
  ],
};
```

#### Démarrer avec PM2

```bash
# Créer le dossier logs
mkdir -p logs

# Démarrer les applications
pm2 start ecosystem.config.cjs

# Voir le statut
pm2 status

# Voir les logs
pm2 logs

# Arrêter les applications
pm2 stop all

# Redémarrer les applications
pm2 restart all

# Configurer le démarrage automatique au boot
pm2 startup
pm2 save
```

## 🌐 Configuration du pare-feu

Si vous avez un pare-feu activé (ufw, iptables) :

```bash
# Autoriser les ports nécessaires
sudo ufw allow 3000/tcp  # Backend
sudo ufw allow 8080/tcp  # Frontend
sudo ufw reload
```

## 🔒 Accès depuis l'extérieur

### Option 1 : Accès direct

Accédez depuis un autre ordinateur :
```
http://IP-DU-SERVEUR:8080
```

### Option 2 : Utiliser un reverse proxy Nginx (production)

#### Installer Nginx

```bash
sudo apt install -y nginx
```

#### Créer une configuration

```bash
sudo nano /etc/nginx/sites-available/excalia-bot
```

Contenu :

```nginx
server {
    listen 80;
    server_name votre-domaine.com;  # ou l'IP du serveur

    # Frontend React
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API Backend
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### Activer la configuration

```bash
sudo ln -s /etc/nginx/sites-available/excalia-bot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

Accès : `http://votre-domaine.com` ou `http://IP-SERVEUR`

## 🛠️ Dépannage

### Port déjà utilisé

```bash
# Trouver le processus utilisant un port
sudo lsof -i :3000
sudo lsof -i :8080

# Tuer le processus
sudo kill -9 <PID>
```

### Permissions

```bash
# Donner les bonnes permissions
sudo chown -R $USER:$USER /home/user/excalia-bot
chmod -R 755 /home/user/excalia-bot
```

### Logs

```bash
# Logs PM2
pm2 logs excalia-bot-backend
pm2 logs excalia-bot-frontend

# Logs Node.js directs
node bot.cjs 2>&1 | tee backend.log
```

### Mise à jour Node.js

```bash
# Si vous avez une vieille version
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt update
sudo apt install -y nodejs
```

## 🔄 Mise à jour de l'application

```bash
cd /home/user/excalia-bot

# Arrêter les services
pm2 stop all

# Mettre à jour le code (si Git)
git pull

# Réinstaller les dépendances
npm install

# Redémarrer
pm2 restart all
```

## 📊 Monitoring

```bash
# Voir l'utilisation des ressources
pm2 monit

# Interface web PM2 (optionnel)
pm2 web
```

## 🔐 Sécurité (Production)

```bash
# Créer un utilisateur dédié
sudo adduser excaliabot
sudo su - excaliabot

# Installer l'app dans le home de cet utilisateur
cd ~
# ... installer l'application ...

# Utiliser PM2 avec cet utilisateur
pm2 startup
```

## 📝 Variables d'environnement

Créer un fichier `.env` à la racine :

```bash
nano .env
```

Contenu :

```env
NODE_ENV=production
WEB_PORT=3000
```

## ✅ Vérification de l'installation

```bash
# Vérifier que tout fonctionne
curl http://localhost:3000/health
curl http://localhost:8080

# Depuis un autre ordinateur
curl http://IP-SERVEUR:3000/health
```

## 🆘 Support

Si vous rencontrez des problèmes :

1. Vérifier les logs : `pm2 logs`
2. Vérifier que Node.js est à jour : `node --version`
3. Vérifier que les ports sont ouverts : `sudo netstat -tlnp | grep -E '3000|8080'`
4. Vérifier le pare-feu : `sudo ufw status`

