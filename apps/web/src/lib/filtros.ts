/**
 * Lectura de los filtros desde la URL, del lado del servidor.
 *
 * La contraparte de `packages/ui/src/componentes/filtros.tsx`, que los
 * escribe. Que las diez pantallas usen esta misma función es lo que hace que
 * `?estado=pendiente,confirmado` signifique lo mismo en todas.
 */

export type Parametros = Record<string, string | string[] | undefined>;

/** Un parámetro simple. Ignora los repetidos, que aquí nunca son válidos. */
export function texto(params: Parametros, clave: string): string | undefined {
  const valor = params[clave];
  const bruto = Array.isArray(valor) ? valor[0] : valor;
  const limpio = bruto?.trim();
  return limpio || undefined;
}

/** Un parámetro de valores múltiples: `?estado=pendiente,confirmado`. */
export function lista(params: Parametros, clave: string): string[] | undefined {
  const bruto = texto(params, clave);
  if (!bruto) return undefined;
  const valores = bruto.split(',').map((v) => v.trim()).filter(Boolean);
  return valores.length ? valores : undefined;
}

/** Solo acepta el formato aaaa-MM-dd; cualquier otra cosa se descarta. */
export function fecha(params: Parametros, clave: string): string | undefined {
  const bruto = texto(params, clave);
  return bruto && /^\d{4}-\d{2}-\d{2}$/.test(bruto) ? bruto : undefined;
}

export function pagina(params: Parametros): number {
  const n = Number.parseInt(texto(params, 'pagina') ?? '1', 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/** Los filtros que comparten todas las tablas. */
export function comunes(params: Parametros) {
  return {
    busqueda: texto(params, 'q'),
    estados: lista(params, 'estado'),
    desde: fecha(params, 'desde'),
    hasta: fecha(params, 'hasta'),
  };
}

/** Opciones de estado activo/inactivo, que se repiten en varios catálogos. */
export const OPCIONES_ACTIVO = [
  { valor: 'activo', etiqueta: 'Activo' },
  { valor: 'inactivo', etiqueta: 'Inactivo' },
];

export const ETIQUETAS_ACTIVO = { activo: 'Activo', inactivo: 'Inactivo' };
