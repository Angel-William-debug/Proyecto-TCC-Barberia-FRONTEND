import { ARTICULOS_ADMINISTRACION } from './articulos-administracion';
import { ARTICULOS_CLIENTE } from './articulos-cliente';
import { ARTICULOS_COMUNES } from './articulos-comunes';
import { ARTICULOS_OPERACION } from './articulos-operacion';
import { CATEGORIAS } from './categorias';
import type { Articulo, Audiencia, Categoria } from './tipos';

export type { Articulo, Audiencia, Categoria } from './tipos';
export { CATEGORIAS } from './categorias';

/**
 * Todos los artículos, ordenados por categoría (en el orden de `CATEGORIAS`)
 * y, dentro de cada una, en el orden en que se escribieron, que es el de la
 * tarea: primero ver, después crear, al final lo excepcional.
 */
export const ARTICULOS: readonly Articulo[] = (() => {
  const todos = [
    ...ARTICULOS_COMUNES,
    ...ARTICULOS_OPERACION,
    ...ARTICULOS_ADMINISTRACION,
    ...ARTICULOS_CLIENTE,
  ];
  const orden = new Map(CATEGORIAS.map((c, i) => [c.id, i]));
  return todos
    .map((a, i) => ({ a, i }))
    .sort((x, y) => (orden.get(x.a.categoria) ?? 99) - (orden.get(y.a.categoria) ?? 99) || x.i - y.i)
    .map(({ a }) => a);
})();

const POR_ID = new Map(ARTICULOS.map((a) => [a.id, a]));

export const ETIQUETA_AUDIENCIA: Record<Audiencia, string> = {
  administrador: 'Administrador',
  recepcionista: 'Recepcionista',
  profesional: 'Barbero',
  cliente: 'Cliente',
};

export function articuloPorId(id: string): Articulo | undefined {
  return POR_ID.get(id);
}

export function articulosPara(rol: Audiencia): Articulo[] {
  return ARTICULOS.filter((a) => a.roles.includes(rol));
}

export function puedeLeer(rol: Audiencia, articulo: Articulo): boolean {
  return articulo.roles.includes(rol);
}

/** Las categorías que tienen al menos un artículo para el rol, con sus artículos. */
export function seccionesPara(rol: Audiencia): Array<{ categoria: Categoria; articulos: Articulo[] }> {
  const propios = articulosPara(rol);
  return CATEGORIAS.map((categoria) => ({
    categoria,
    articulos: propios.filter((a) => a.categoria === categoria.id),
  })).filter((s) => s.articulos.length > 0);
}

/**
 * Problemas del contenido: ids repetidos, categorías inexistentes y enlaces
 * `[[id]]` o `relacionados` que apuntan a un artículo que no existe. Lo usa
 * `scripts/verificar-ayuda.ts`; un enlace roto no rompe la página (se muestra
 * como texto), pero no debería llegar a publicarse.
 */
export function problemasDelContenido(): string[] {
  const problemas: string[] = [];
  const vistos = new Set<string>();
  const categorias = new Set(CATEGORIAS.map((c) => c.id));
  for (const a of ARTICULOS) {
    if (vistos.has(a.id)) problemas.push(`id repetido: ${a.id}`);
    vistos.add(a.id);
    if (!categorias.has(a.categoria)) problemas.push(`${a.id}: categoría inexistente «${a.categoria}»`);
    if (a.roles.length === 0) problemas.push(`${a.id}: sin roles`);
    for (const [, destino] of a.cuerpo.matchAll(/\[\[([a-z0-9-]+)\]\]/g)) {
      if (!POR_ID.has(destino!)) problemas.push(`${a.id}: enlace roto [[${destino}]]`);
    }
    for (const destino of a.relacionados ?? []) {
      if (!POR_ID.has(destino)) problemas.push(`${a.id}: relacionado inexistente ${destino}`);
    }
    if (a.cuerpo.includes('`')) problemas.push(`${a.id}: el cuerpo tiene comillas invertidas`);
  }
  return problemas;
}
