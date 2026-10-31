import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export { clsx, type ClassValue };

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export * from "./heatmap";
export * from "./audio";
export * from "./break-ratio";
export * from "./soundscape";
export * from "./velocity";
export * from "./data-hub";
