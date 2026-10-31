import * as React from "react";
import { cn } from "@focus/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const base = "inline-flex items-center justify-center whitespace-nowrap rounded-[10px] text-sm font-medium transition-all duration-300 ease-out active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 select-none";
    
    const variants: Record<string, string> = {
      default: "bg-[#f2f1ec] text-[#0a0a0b] hover:bg-[#f2f1ec]/90 shadow-sm",
      secondary: "bg-[#17181c] text-[#f4f4f2] hover:bg-[#17181c]/80 border border-white/5",
      outline: "border border-white/10 bg-transparent text-[#f4f4f2] hover:bg-white/5",
      ghost: "text-[#8a8c92] hover:text-[#f4f4f2] hover:bg-white/5",
      destructive: "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20",
    };

    const sizes: Record<string, string> = {
      default: "h-9 px-4 py-2",
      sm: "h-8 rounded-[8px] px-3 text-xs",
      lg: "h-10 rounded-[10px] px-6",
      icon: "h-9 w-9",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
