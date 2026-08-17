/**
 * Utilidades de filtrado.
 *
 * Se usan en la rama de modo demostración, donde no hay base que filtre y hay
 * que hacerlo sobre un arreglo en memoria. La rama real traduce los mismos
 * filtros a cláusulas de PostgREST (`ilike`, `in`, `gte`, `lte`), de modo que
 * el resultado sea el mismo por los dos caminos.
 */

/** Filtros que admite cualquier listado del sistema. */
export interface FiltroTabla {
  /** Texto libre. */
  busqueda?: string;
  /** Valores de estado seleccionados. Vacío o ausente significa «todos». */
  estados?: string[];
  /** Rango de fechas, aaaa-MM-dd. */
  desde?: string;
  hasta?: string;
  pagina?: number;
  porPagina?: number;
}

/**
 * `true` si alguno de los campos contiene el texto buscado.
 *
 * Normaliza los acentos: quien escribe «gonzalez» espera encontrar a
 * «González». Sin esto, la búsqueda falla justo con los apellidos más comunes
 * del país.
 */
export function coincideTexto(campos: Array<string | null | undefined>, busqueda?: string) {
  const t = normalizar(busqueda);
  if (!t) return true;
  return campos.some((c) => normalizar(c).includes(t));
}

function normalizar(valor: string | null | undefined): string {
  if (!valor) return '';
  // NFD separa la letra de su tilde; el rango U+0300–U+036F son esas tildes
  // sueltas, que se descartan. Se escribe con escapes y no con los caracteres
  // literales porque estos son invisibles en el editor.
  return valor
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/** `true` si el estado está entre los elegidos, o si no se eligió ninguno. */
export function coincideEstado(estado: string, estados?: string[]) {
  return !estados?.length || estados.includes(estado);
}

/** `true` si la fecha cae dentro del rango. Un valor nulo solo pasa si no hay rango. */
export function entreFechas(fecha: string | null, desde?: string, hasta?: string) {
  if (!desde && !hasta) return true;
  if (!fecha) return false;

  const dia = fecha.slice(0, 10);
  if (desde && dia < desde) return false;
  if (hasta && dia > hasta) return false;
  return true;
}

/** Corta un arreglo en la página pedida y devuelve el envoltorio paginado. */
export function paginar<T>(filas: T[], pagina = 1, porPagina = 25) {
  const p = Math.max(1, pagina);
  const desde = (p - 1) * porPagina;

  return {
    datos: filas.slice(desde, desde + porPagina),
    total: filas.length,
    pagina: p,
    porPagina,
    totalPaginas: Math.max(1, Math.ceil(filas.length / porPagina)),
  };
}
