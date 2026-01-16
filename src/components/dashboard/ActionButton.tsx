import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface ActionButtonProps {
  onClick: () => void;
  variant: "primary" | "danger" | "success" | "warning" | "purple" | "secondary";
  children: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
  disabled?: boolean;
}

const variantStyles = {
  primary: "bg-secondary hover:bg-secondary/80 text-secondary-foreground shadow-[0_0_20px_hsl(210_100%_45%_/_0.3)]",
  danger: "bg-destructive hover:bg-destructive/80 text-destructive-foreground shadow-[0_0_20px_hsl(0_72%_51%_/_0.3)]",
  success: "bg-primary hover:bg-primary/80 text-primary-foreground shadow-[0_0_20px_hsl(145_63%_42%_/_0.3)]",
  warning: "bg-warning hover:bg-warning/80 text-warning-foreground shadow-[0_0_20px_hsl(38_92%_50%_/_0.3)]",
  purple: "bg-purple hover:bg-purple/80 text-purple-foreground shadow-[0_0_20px_hsl(270_65%_55%_/_0.3)]",
  secondary: "bg-muted hover:bg-muted/80 text-foreground",
};

export const ActionButton = ({ onClick, variant, children, icon: Icon, className = "", disabled }: ActionButtonProps) => {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full px-4 py-3 rounded-lg font-semibold text-sm
        flex items-center justify-center gap-2
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </motion.button>
  );
};
