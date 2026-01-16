import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface BotConfig {
  host: string;
  port: string;
  username: string;
  auth: string;
}

interface StatusUpdate {
  health: number;
  pos: string;
  xp: {
    level: number;
    progress: number;
  };
}

interface MsaCodeData {
  verification_uri: string;
  user_code: string;
  message: string;
}

interface LogEntry {
  id: string;
  time: string;
  message: string;
}

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isBotConnected, setIsBotConnected] = useState(false);
  const [status, setStatus] = useState<StatusUpdate>({
    health: 0,
    pos: "X: 0 Y: 0 Z: 0",
    xp: { level: 0, progress: 0 },
  });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [msaData, setMsaData] = useState<MsaCodeData | null>(null);

  // Initialisation de la connexion Socket.IO
  useEffect(() => {
    const socketInstance = io("http://localhost:3000", {
      transports: ["websocket", "polling"],
    });

    setSocket(socketInstance);

    // Événement: connexion Socket.IO établie
    socketInstance.on("connect", () => {
      console.log("✅ Connecté au serveur Socket.IO");
      setIsConnected(true);
    });

    // Événement: déconnexion Socket.IO
    socketInstance.on("disconnect", () => {
      console.log("❌ Déconnecté du serveur Socket.IO");
      setIsConnected(false);
    });

    // Événement: état de connexion du bot
    socketInstance.on("bot_connected", (connected: boolean) => {
      console.log("Bot connected:", connected);
      setIsBotConnected(connected);
    });

    // Événement: mise à jour du statut du bot
    socketInstance.on("status_update", (data: StatusUpdate) => {
      setStatus(data);
    });

    // Événement: logs du bot
    socketInstance.on("log", (message: string) => {
      const newLog: LogEntry = {
        id: Date.now().toString() + Math.random(),
        time: new Date().toLocaleTimeString(),
        message,
      };
      setLogs((prev) => {
        const newLogs = [...prev, newLog];
        // Limiter à 200 logs maximum pour éviter les problèmes de performance
        return newLogs.slice(-23);
      });
    });

    // Événement: code d'authentification Microsoft
    socketInstance.on("msa_code", (data: MsaCodeData) => {
      console.log("MSA Code reçu:", data);
      setMsaData(data);
    });

    // Nettoyage à la déconnexion
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Connecter le bot
  const connectBot = useCallback(
    (config: BotConfig) => {
      if (socket) {
        socket.emit("connect_bot", config);
      }
    },
    [socket]
  );

  // Déconnecter le bot
  const disconnectBot = useCallback(() => {
    if (socket) {
      socket.emit("disconnect_bot");
    }
  }, [socket]);

  // Envoyer une commande
  const sendCommand = useCallback(
    (command: string) => {
      if (socket) {
        socket.emit("command", command);
      }
    },
    [socket]
  );

  // Téléporter vers un joueur
  const teleportTo = useCallback(
    (username: string) => {
      if (socket) {
        socket.emit("teleport_to", username);
      }
    },
    [socket]
  );

  // Fonction pour vider les logs
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return {
    isConnected,
    isBotConnected,
    status,
    logs,
    msaData,
    connectBot,
    disconnectBot,
    sendCommand,
    teleportTo,
    clearMsaData: () => setMsaData(null),
    clearLogs,
  };
};
