/**
 * Ayuda para leer relaciones de PostgREST.
 *
 * Cuando una consulta anida una tabla relacionada, PostgREST a veces devuelve
 * un objeto y a veces un arreglo de un elemento, segun como infiera la
 * cardinalidad. Esta funcion normaliza las dos formas para que cada modulo no
 * repita la misma comprobacion.
 *
 * Vivia suelta dentro de `operaciones.ts`; al partir ese archivo en modulos
 * habia que copiarla seis veces o sacarla aca.
 */
export function uno<T>(valor: unknown): T | null {
  if (Array.isArray(valor)) return (valor[0] as T) ?? null;
  return (valor as T) ?? null;
}
