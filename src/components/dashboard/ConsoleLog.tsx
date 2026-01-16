import { motion, AnimatePresence } from "framer-motion";
import { Terminal } from "lucide-react";
import { useRef, useEffect } from "react";

interface LogEntry {
  id: string;
  time: string;
  message: string;
}

interface ConsoleLogProps {
  logs: LogEntry[];
}

export const ConsoleLog = ({ logs }: ConsoleLogProps) => {
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
        <div>
          <h3 className="font-display text-lg font-semibold">Console du Bot</h3>
          <p className="text-xs text-muted-foreground">{logs.length} entrées</p>
        </div>
        <div className="ml-auto flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-destructive/80" />
          <div className="w-3 h-3 rounded-full bg-warning/80" />
          <div className="w-3 h-3 rounded-full bg-primary/80" />
        </div>
      </div>

      {/* Logs */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-custom bg-[hsl(220_25%_6%)] font-mono text-sm">
        <AnimatePresence mode="popLayout">
          {logs.length === 0 ? (
            <div className="text-muted-foreground text-center py-8">
              En attente de logs...
            </div>
          ) : (
            logs.map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="py-1.5 border-b border-border/20 last:border-0 flex gap-3"
              >
                <span className="text-muted-foreground shrink-0">[{log.time}]</span>
                <span className="text-foreground/90 whitespace-pre-wrap break-all">{log.message}</span>
              </motion.div>
            ))
          )}
        </AnimatePresence>
        <div ref={logsEndRef} />
      </div>
    </motion.div>
  );
};
