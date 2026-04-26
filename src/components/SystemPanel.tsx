import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SystemPanelProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

/** Solo-Leveling style framed panel with glowing corner brackets. */
export const SystemPanel = ({ children, className, title }: SystemPanelProps) => (
  <div className={cn("panel rounded-sm p-4 animate-float-up", className)}>
    {title && (
      <div className="mb-3 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
        <h3 className="font-display text-sm uppercase tracking-[0.2em] text-primary text-glow-soft">
          {title}
        </h3>
        <div className="ml-auto h-px flex-1 bg-gradient-to-r from-primary/60 to-transparent" />
      </div>
    )}
    {children}
  </div>
);
