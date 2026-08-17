import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina clases de Tailwind resolviendo conflictos.
 *
 * `clsx` arma la lista a partir de condicionales; `twMerge` descarta las
 * utilidades que quedan pisadas. Sin el segundo paso, `cn('p-2', 'p-4')`
 * dejaria ambas y ganaria la que el CSS declare ultima, que no es
 * necesariamente la que el autor quiso.
 */
export function cn(...clases: ClassValue[]): string {
  return twMerge(clsx(clases));
}
