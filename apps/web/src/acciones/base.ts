import { revalidatePath } from 'next/cache';

import { ErrorAplicacion } from '@barber-shop/api';

/**
 * Piezas compartidas por todas las acciones de servidor.
 *
 * Toda accion devuelve este objeto en lugar de lanzar: una excepcion que
 * atraviesa la frontera servidor-cliente llega al navegador como un mensaje
 * generico -«an error occurred in the Server Components render»- y el usuario
 * se queda sin saber que paso. Devolviendo el error como dato, el formulario
 * lo puede mostrar donde corresponde.
 */

export type ResultadoAccion =
  | { ok: true; id?: number }
  | { ok: false; error: string; campos?: Record<string, string> };

/** Texto limpio de un campo del formulario. Cadena vacia se trata como ausente. */
export function texto(datos: FormData, clave: string): string {
  return String(datos.get(clave) ?? '').trim();
}

/** Texto opcional: devuelve null en lugar de cadena vacia. */
export function textoOpcional(datos: FormData, clave: string): string | null {
  return texto(datos, clave) || null;
}

/**
 * Numero de un campo. Acepta la coma decimal, que es como se escribe en
 * Paraguay, y los puntos de miles que el usuario pega desde otro lado.
 */
export function numero(datos: FormData, clave: string): number | null {
  const bruto = texto(datos, clave);
  if (!bruto) return null;
  const limpio = bruto.replace(/\./g, '').replace(',', '.');
  const n = Number(limpio);
  return Number.isFinite(n) ? n : null;
}

/** Una casilla ausente en el FormData significa «desmarcada». */
export function booleano(datos: FormData, clave: string): boolean {
  return datos.get(clave) !== null;
}

/** Acumulador de errores por campo. */
export class Validacion {
  private readonly campos: Record<string, string> = {};

  exigir(condicion: boolean, campo: string, mensaje: string): void {
    if (!condicion && !this.campos[campo]) this.campos[campo] = mensaje;
  }

  get hayErrores(): boolean {
    return Object.keys(this.campos).length > 0;
  }

  get resultado(): ResultadoAccion {
    return {
      ok: false,
      error: 'Revise los campos marcados.',
      campos: this.campos,
    };
  }
}

/** Formato de correo. El mismo que exige el CHECK de la base. */
export const CORREO = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Envoltorio comun: traduce la excepcion en un resultado que el formulario
 * entiende, y revalida la ruta para que la tabla se actualice sola.
 */
export async function ejecutar(
  ruta: string,
  operacion: () => Promise<number | void>,
): Promise<ResultadoAccion> {
  try {
    const id = await operacion();
    revalidatePath(ruta);
    return typeof id === 'number' ? { ok: true, id } : { ok: true };
  } catch (causa) {
    const mensaje =
      causa instanceof ErrorAplicacion
        ? causa.message
        : 'No se pudo guardar. Intente nuevamente en unos instantes.';
    return { ok: false, error: mensaje };
  }
}

/**
 * Lee las lineas repetidas de un formulario.
 *
 * El detalle de un turno o de una orden llega como campos con el mismo nombre
 * repetido -`servicio`, `servicio`, `servicio`-, que es como el navegador
 * envia una lista sin necesidad de JavaScript. `getAll` los recupera en orden,
 * de modo que la posicion N de una lista se corresponde con la N de la otra.
 */
export function lineas(datos: FormData, ...claves: string[]): string[][] {
  const columnas = claves.map((c) => datos.getAll(c).map((v) => String(v).trim()));
  const largo = Math.max(0, ...columnas.map((c) => c.length));
  const filas: string[][] = [];
  for (let i = 0; i < largo; i++) filas.push(columnas.map((c) => c[i] ?? ''));
  return filas;
}
