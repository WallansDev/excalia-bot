import { motion } from "framer-motion";
import { ReactNode } from "react";

interface ControlSectionProps {
  title: string;
  icon: string;
  children: ReactNode;
  delay?: number;
}

export const ControlSection = ({ title, icon, children, delay = 0 }: ControlSectionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="space-y-3"
    >
      <h3 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
        <span className="text-base">{icon}</span>
        {title}
      </h3>
      <div className="space-y-2">
        {children}
      </div>
    </motion.div>
  );
};
