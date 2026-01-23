import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCapacityColor(score: number): string {
    if (score >= 10) return '#22c55e'; // Safe (Green)
    if (score >= 4) return '#eab308'; // Warning (Yellow)
    return '#ef4444'; // Critical (Red)
}
