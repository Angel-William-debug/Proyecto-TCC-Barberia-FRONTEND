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

export function pagina(params: Parametros, clave = 'pagina'): number {
  const n = Number.parseInt(texto(params, clave) ?? '1', 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/**
 * Filas por pagina en TODAS las tablas del sistema. Pedido de la directora:
 * hasta diez registros a la vista, y de ahi en mas, paginacion. Vive en un
 * solo lugar para que ninguna tabla quede con otro numero.
 */
export const FILAS_POR_PAGINA = 10;

/**
 * Corta las filas en la pagina que pide la URL.
 *
 * Las tablas del panel traen el resultado filtrado entero -son catalogos de
 * una sola barberia, de decenas o pocos cientos de filas- y paginan aca, en
 * el servidor, antes de armar el HTML: al navegador solo llegan diez. La
 * excepcion es Clientes, la unica que puede crecer sin techo, que pagina en
 * la consulta con `range()`.
 *
 * Una pagina fuera de rango -la 7 de un resultado que ahora tiene tres- cae
 * en la ultima en vez de mostrar una tabla vacia que parece "sin datos".
 *
 * `clave` existe porque hay pantallas con dos tablas (Compras, Inventario):
 * cada una necesita su propio parametro, o avanzar en una avanzaria la otra.
 */
export function paginarFilas<T>(filas: T[], params: Parametros, clave = 'pagina') {
  const totalPaginas = Math.max(1, Math.ceil(filas.length / FILAS_POR_PAGINA));
  const actual = Math.min(pagina(params, clave), totalPaginas);
  const desde = (actual - 1) * FILAS_POR_PAGINA;

  return {
    filas: filas.slice(desde, desde + FILAS_POR_PAGINA),
    // Aparte de las filas porque va a un componente de cliente: pasarle las
    // filas las serializaria al navegador sin que las use.
    paginacion: {
      pagina: actual,
      totalPaginas,
      total: filas.length,
      porPagina: FILAS_POR_PAGINA,
      parametro: clave,
    },
  };
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
