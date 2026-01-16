import { motion } from "framer-motion";
import { Heart, MapPin, Sparkles } from "lucide-react";

interface StatusCardProps {
  isConnected: boolean;
  health: number;
  position: string;
  level: number;
  xpProgress: number;
}

export const StatusCard = ({ isConnected, health, position, level, xpProgress }: StatusCardProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-5 gradient-border"
    >
      {/* Connection Status */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative">
          <motion.div
            animate={isConnected ? { scale: [1, 1.2, 1] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
            className={`w-3 h-3 rounded-full ${
              isConnected ? "bg-primary animate-pulse-glow" : "bg-destructive"
            }`}
          />
          {isConnected && (
            <div className="absolute inset-0 w-3 h-3 rounded-full bg-primary/50 animate-ping" />
          )}
        </div>
        <span className={`font-medium ${isConnected ? "text-primary" : "text-destructive"}`}>
          {isConnected ? "Connecté" : "Déconnecté"}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="space-y-4">
        {/* Health */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
            <Heart className="w-5 h-5 text-destructive" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Santé</span>
              <span className="font-semibold">{health} / 20</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(health / 20) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-destructive to-red-400 rounded-full"
              />
            </div>
          </div>
        </div>

        {/* Position */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-secondary" />
          </div>
          <div className="flex-1">
            <span className="text-sm text-muted-foreground">Position</span>
            <p className="font-mono text-sm font-medium">{position || "--"}</p>
          </div>
        </div>

        {/* XP */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Niveau {level}</span>
              <span className="text-primary font-medium">{Math.round(xpProgress * 100)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress * 100}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-primary to-emerald-300 rounded-full shadow-[0_0_10px_hsl(145_63%_42%_/_0.5)]"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
