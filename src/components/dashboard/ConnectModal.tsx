import { motion, AnimatePresence } from "framer-motion";
import { X, Plug } from "lucide-react";
import { useState } from "react";

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (config: BotConfig) => void;
}

interface BotConfig {
  host: string;
  port: string;
  username: string;
  auth: "offline" | "microsoft";
}

export const ConnectModal = ({ isOpen, onClose, onConnect }: ConnectModalProps) => {
  const [host, setHost] = useState("");
  const [port, setPort] = useState("");
  const [username, setUsername] = useState("");
  const [auth, setAuth] = useState<"offline" | "microsoft">("offline");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConnect({ host, port, username, auth });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative glass-strong rounded-2xl p-6 w-full max-w-md gradient-border shadow-card"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Plug className="w-6 h-6 text-primary" />
                </div>
                <h2 className="font-display text-xl font-bold">Connexion au serveur</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Adresse du serveur (Host)</label>
                <input
                  type="text"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="localhost"
                  required
                  className="w-full px-4 py-3 rounded-lg bg-input border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Port</label>
                <input
                  type="number"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  placeholder="25565"
                  min="1"
                  max="65535"
                  required
                  className="w-full px-4 py-3 rounded-lg bg-input border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Type d'authentification</label>
                <select
                  value={auth}
                  onChange={(e) => setAuth(e.target.value as "offline" | "microsoft")}
                  className="w-full px-4 py-3 rounded-lg bg-input border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                >
                  <option value="offline">Offline (cracked)</option>
                  <option value="microsoft">Microsoft</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {auth === "microsoft" ? "Adresse mail du compte Microsoft" : "Nom d'utilisateur du bot"}
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={auth === "microsoft" ? "exemple@email.com" : "Steve"}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-input border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-4 py-3 rounded-lg font-semibold bg-primary text-primary-foreground shadow-glow"
                >
                  Se connecter
                </motion.button>
                <motion.button
                  type="button"
                  onClick={onClose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-4 py-3 rounded-lg font-semibold bg-destructive text-destructive-foreground"
                >
                  Annuler
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
