import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bot, Plug, PlugZap, Sword, Square, Package, Eye, Send } from "lucide-react";
import { StatusCard } from "@/components/dashboard/StatusCard";
import { ActionButton } from "@/components/dashboard/ActionButton";
import { ControlSection } from "@/components/dashboard/ControlSection";
import { ConsoleLog } from "@/components/dashboard/ConsoleLog";
import { ConnectModal } from "@/components/dashboard/ConnectModal";
import { MsaModal } from "@/components/dashboard/MsaModal";
import { toast } from "sonner";
import { useSocket } from "@/hooks/useSocket";

const Index = () => {
  // Socket.IO hook pour la connexion au serveur bot.js
  const {
    isConnected: socketConnected,
    isBotConnected,
    status,
    logs,
    msaData,
    connectBot,
    disconnectBot,
    sendCommand: sendSocketCommand,
    teleportTo,
    clearMsaData,
    clearLogs,
  } = useSocket();

  const [tpTarget, setTpTarget] = useState("");
  
  // Modals
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [msaModalOpen, setMsaModalOpen] = useState(false);

  // Afficher le modal MSA automatiquement quand les données sont reçues
  useEffect(() => {
    if (msaData) {
      setMsaModalOpen(true);
    }
  }, [msaData]);

  // Toast pour indiquer l'état de connexion Socket.IO
  useEffect(() => {
    if (socketConnected) {
      toast.success("Connecté au serveur");
    }
  }, [socketConnected]);

  // Actions
  const sendCommand = (cmd: string) => {
    sendSocketCommand(cmd);
    toast.success(`Commande "${cmd}" envoyée`);
  };

  const handleConnect = (config: { host: string; port: string; username: string; auth: string }) => {
    connectBot(config);
    setConnectModalOpen(false);
  };

  const handleDisconnect = () => {
    disconnectBot();
    toast.info("Déconnexion du bot...");
  };

  const handleTeleport = () => {
    if (!tpTarget.trim()) {
      toast.error("Veuillez entrer un pseudo !");
      return;
    }
    teleportTo(tpTarget);
    setTpTarget("");
    toast.info(`Téléportation vers ${tpTarget}...`);
  };

  const handleCloseMsaModal = () => {
    setMsaModalOpen(false);
    clearMsaData();
  };

  return (
    <div className="min-h-screen p-4 md:p-8 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center gap-4"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center shadow-glow"
          >
            <Bot className="w-8 h-8 text-primary-foreground" />
          </motion.div>
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold glow-text bg-gradient-to-r from-primary via-emerald-400 to-primary bg-clip-text text-transparent">
              ExcaliaBot
            </h1>
            <p className="text-muted-foreground text-sm">Control Panel</p>
          </div>
        </motion.header>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-[320px_1fr] gap-6">
          {/* Left Column - Controls */}
          <div className="space-y-6">
            {/* Status Card */}
            <StatusCard
              isConnected={isBotConnected}
              health={status.health}
              position={status.pos}
              level={status.xp.level}
              xpProgress={status.xp.progress}
            />

            {/* Controls Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-xl p-5 gradient-border space-y-6"
            >
              {/* Connection */}
              <ControlSection title="Connexion" icon="🔌">
                {!isBotConnected ? (
                  <ActionButton
                    onClick={() => setConnectModalOpen(true)}
                    variant="success"
                    icon={Plug}
                  >
                    Connecter le bot
                  </ActionButton>
                ) : (
                  <ActionButton
                    onClick={handleDisconnect}
                    variant="danger"
                    icon={PlugZap}
                  >
                    Déconnecter le bot
                  </ActionButton>
                )}
              </ControlSection>

              {/* Combat */}
              <ControlSection title="Chasse" icon="⚔️" delay={0.05}>
                <ActionButton
                  onClick={() => sendCommand("start_farm")}
                  variant="success"
                  icon={Sword}
                >
                  Démarrer Farm Chasseur
                </ActionButton>
                <ActionButton
                  onClick={() => sendCommand("stop_farm")}
                  variant="danger"
                  icon={Square}
                >
                  Arrêter Farm
                </ActionButton>
              </ControlSection>

              {/* Inventory */}
              <ControlSection title="Inventaire" icon="🎒" delay={0.1}>
                <ActionButton
                  onClick={() => sendCommand("dump_inventory")}
                  variant="warning"
                  icon={Package}
                >
                  Vider dans coffre
                </ActionButton>
                <ActionButton
                  onClick={() => sendCommand("show_inventory")}
                  variant="purple"
                  icon={Eye}
                >
                  Afficher
                </ActionButton>
              </ControlSection>

              {/* Utils */}
              <ControlSection title="Utils" icon="🔧" delay={0.15}>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={tpTarget}
                    onChange={(e) => setTpTarget(e.target.value)}
                    placeholder="Pseudo du joueur..."
                    className="w-full px-4 py-3 rounded-lg bg-input border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                    onKeyDown={(e) => e.key === "Enter" && handleTeleport()}
                  />
                  <ActionButton
                    onClick={handleTeleport}
                    variant="primary"
                    icon={Send}
                  >
                    Se Téléporter
                  </ActionButton>
                </div>
              </ControlSection>
            </motion.div>
          </div>

          {/* Right Column - Console */}
          <div className="min-h-[500px] lg:min-h-0">
            <ConsoleLog logs={logs} onClear={clearLogs} />
          </div>
        </div>
      </div>

      {/* Modals */}
      <ConnectModal
        isOpen={connectModalOpen}
        onClose={() => setConnectModalOpen(false)}
        onConnect={handleConnect}
      />
      <MsaModal
        isOpen={msaModalOpen}
        onClose={handleCloseMsaModal}
        code={msaData?.user_code || ""}
        link={msaData?.verification_uri || ""}
        message={msaData?.message || ""}
      />
    </div>
  );
};

export default Index;
