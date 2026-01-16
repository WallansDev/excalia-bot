import { motion, AnimatePresence } from "framer-motion";
import { X, Shield, ExternalLink, Copy } from "lucide-react";
import { toast } from "sonner";

interface MsaModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  link: string;
  message: string;
}

export const MsaModal = ({ isOpen, onClose, code, link, message }: MsaModalProps) => {
  const copyCode = () => {
    navigator.clipboard.writeText(code);
    toast.success("Code copié !");
  };

  const openLink = () => {
    window.open(link, "_blank");
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
                <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-secondary" />
                </div>
                <h2 className="font-display text-xl font-bold">Authentification Microsoft</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-5">
              <p className="text-muted-foreground">{message}</p>

              {/* Code */}
              <div>
                <label className="block text-sm font-medium mb-2">Code de vérification</label>
                <div 
                  onClick={copyCode}
                  className="relative bg-muted rounded-xl p-4 text-center cursor-pointer group hover:bg-muted/80 transition-colors"
                >
                  <span className="font-display text-3xl font-bold tracking-[0.3em] text-primary glow-text">
                    {code || "-"}
                  </span>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Copy className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              </div>

              {/* Link */}
              <div>
                <label className="block text-sm font-medium mb-2">Lien de vérification</label>
                <div className="bg-muted rounded-xl p-4 break-all">
                  <a 
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-secondary hover:underline"
                  >
                    {link || "Lien non disponible"}
                  </a>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 pt-2">
                <motion.button
                  onClick={openLink}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-4 py-3 rounded-lg font-semibold bg-secondary text-secondary-foreground flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ouvrir le lien dans le navigateur
                </motion.button>
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-4 py-3 rounded-lg font-semibold bg-muted text-foreground"
                >
                  Fermer (la connexion continue en arrière-plan)
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
