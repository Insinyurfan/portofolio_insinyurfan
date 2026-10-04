import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Penggabung className.
 *
 * `twMerge` dibutuhkan sejak komponen admin memakai varian: tanpa itu,
 * `cn("px-4", "px-6")` menghasilkan dua utilitas padding yang bertabrakan dan
 * yang menang ditentukan urutan di stylesheet, bukan urutan argumen.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
