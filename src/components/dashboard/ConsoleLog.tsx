import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Trash2 } from "lucide-react";
import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface LogEntry {
  id: string;
  time: string;
  message: string;
}

interface ConsoleLogProps {
  logs: LogEntry[];
  onClear?: () => void;
}

export const ConsoleLog = ({ logs, onClear }: ConsoleLogProps) => {
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll uniquement si l'utilisateur est proche du bas
    if (logsContainerRef.current) {
      const container = logsContainerRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      
      if (isNearBottom) {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [logs]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass rounded-xl overflow-hidden gradient-border h-full flex flex-col"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/50 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
          <Terminal className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-lg font-semibold">Console du Bot</h3>
          <p className="text-xs text-muted-foreground">{logs.length} entrées {logs.length >= 200 && "(limité à 200)"}</p>
        </div>
        {onClear && logs.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-8 gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Vider
          </Button>
        )}
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-destructive/80" />
          <div className="w-3 h-3 rounded-full bg-warning/80" />
          <div className="w-3 h-3 rounded-full bg-primary/80" />
        </div>
      </div>

      {/* Logs */}
      <div 
        ref={logsContainerRef}
        className="flex-1 overflow-y-auto p-4 scrollbar-custom bg-[hsl(220_25%_6%)] font-mono text-sm"
      >
        {logs.length === 0 ? (
          <div className="text-muted-foreground text-center py-8">
            En attente de logs...
          </div>
        ) : (
          <>
            {logs.map((log, index) => {
              // Animation uniquement pour les 10 derniers logs pour la performance
              const shouldAnimate = index >= logs.length - 10;
              
              return shouldAnimate ? (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15 }}
                  className="py-1.5 border-b border-border/20 last:border-0 flex gap-3"
                >
                  <span className="text-muted-foreground shrink-0">[{log.time}]</span>
                  <span className="text-foreground/90 whitespace-pre-wrap break-all">{log.message}</span>
                </motion.div>
              ) : (
                <div
                  key={log.id}
                  className="py-1.5 border-b border-border/20 last:border-0 flex gap-3"
                >
                  <span className="text-muted-foreground shrink-0">[{log.time}]</span>
                  <span className="text-foreground/90 whitespace-pre-wrap break-all">{log.message}</span>
                </div>
              );
            })}
          </>
        )}
        <div ref={logsEndRef} />
      </div>
    </motion.div>
  );
};
