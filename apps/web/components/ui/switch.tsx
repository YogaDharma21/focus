"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
    ({ className, onCheckedChange, checked, ...props }, ref) => (
        <label
            className={cn(
                "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
                checked ? "bg-primary border-primary" : "bg-surface-inset",
                className,
            )}
        >
            <input
                type="checkbox"
                className="peer sr-only"
                ref={ref}
                checked={checked}
                onChange={(e) => onCheckedChange?.(e.target.checked)}
                {...props}
            />
            <span
                className={cn(
                    "pointer-events-none block h-5 w-5 rounded-full shadow-sm ring-0 transition-transform",
                    checked ? "translate-x-5 bg-primary-foreground" : "translate-x-0 bg-muted-foreground",
                )}
            />
        </label>
    ),
);
Switch.displayName = "Switch";

export { Switch };
