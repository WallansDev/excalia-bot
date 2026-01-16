#!/bin/bash

# Script de démarrage pour Debian
# Usage: ./scripts/start-debian.sh

echo "🚀 Démarrage d'ExcaliaBot..."

# Vérifier que Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    echo "Installez-le avec : curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Créer le dossier logs s'il n'existe pas
mkdir -p logs

# Fonction pour démarrer en mode développement
start_dev() {
    echo "🔧 Mode développement"
    
    # Démarrer le backend en arrière-plan
    echo "🔌 Démarrage du backend..."
    node bot.cjs > logs/backend.log 2>&1 &
    BACKEND_PID=$!
    echo "Backend PID: $BACKEND_PID"
    
    # Attendre que le backend démarre
    sleep 3
    
    # Démarrer le frontend
    echo "🎨 Démarrage du frontend..."
    npm run dev
}

# Fonction pour démarrer avec PM2
start_pm2() {
    echo "🚀 Mode production avec PM2"
    
    if ! command -v pm2 &> /dev/null; then
        echo "❌ PM2 n'est pas installé"
        echo "Installez-le avec : sudo npm install -g pm2"
        exit 1
    fi
    
    pm2 start ecosystem.config.cjs
    pm2 logs
}

# Fonction pour arrêter
stop_services() {
    echo "🛑 Arrêt des services..."
    
    if command -v pm2 &> /dev/null; then
        pm2 stop all
    fi
    
    # Arrêter les processus Node.js
    pkill -f "node bot.cjs"
    pkill -f "npm run dev"
    
    echo "✅ Services arrêtés"
}

# Menu
case "$1" in
    dev)
        start_dev
        ;;
    prod|pm2)
        start_pm2
        ;;
    stop)
        stop_services
        ;;
    *)
        echo "Usage: $0 {dev|prod|stop}"
        echo ""
        echo "  dev   - Démarrer en mode développement"
        echo "  prod  - Démarrer en mode production avec PM2"
        echo "  stop  - Arrêter tous les services"
        exit 1
        ;;
esac

