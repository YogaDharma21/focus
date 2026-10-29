import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export { clsx, type ClassValue };

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export * from "./shield";

