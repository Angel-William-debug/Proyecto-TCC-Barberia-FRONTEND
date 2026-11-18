import type { NombreRol } from '@barber-shop/tipos';

import {
  ARTICULOS,
  ETIQUETA_AUDIENCIA,
  articuloPorId,
  seccionesPara,
  type Articulo,
} from '@/contenido/ayuda';

import { leerCuerpo, type Bloque } from './markdown';

export const ROLES_AYUDA: readonly NombreRol[] = ['administrador', 'recepcionista', 'profesional', 'cliente'];

export function esRolAyuda(valor: unknown): valor is NombreRol {
  return typeof valor === 'string' && (ROLES_AYUDA as readonly string[]).includes(valor);
}

/**
 * De qué rol es el manual que se muestra.
 *
 * Cada quien ve el de su rol. El administrador, además, puede abrir el de
 * los demás (`?rol=recepcionista`): es quien capacita al personal y quien le
 * explica al cliente cómo reservar, y tiene que poder ver lo que ellos ven.
 */
export function rolDelManual(rolSesion: NombreRol, pedido: unknown): NombreRol {
  if (rolSesion === 'administrador' && esRolAyuda(pedido)) return pedido;
  return rolSesion;
}

/**
 * Si la sesión puede leer el artículo. El administrador lee todos, por lo
 * mismo que puede abrir cualquier manual.
 */
export function puedeAbrir(rolSesion: NombreRol, articulo: Articulo): boolean {
  return rolSesion === 'administrador' || articulo.roles.includes(rolSesion);
}

/** Los bloques del cuerpo, con los enlaces `[[id]]` resueltos para quien lee. */
export function bloquesDe(articulo: Articulo, rolSesion: NombreRol): Bloque[] {
  return leerCuerpo(articulo.cuerpo, (id) => {
    const destino = articuloPorId(id);
    return destino && { titulo: destino.titulo, abrible: puedeAbrir(rolSesion, destino) };
  });
}

export function etiquetaRol(rol: NombreRol): string {
  return ETIQUETA_AUDIENCIA[rol];
}

export { ARTICULOS, articuloPorId, seccionesPara };
