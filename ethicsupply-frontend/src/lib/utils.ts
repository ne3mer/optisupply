import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class names into a single string, removing duplicates,
 * and properly handling Tailwind CSS classes.
 *
 * @param inputs - Class names or conditional class expressions
 * @returns A merged string of class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
