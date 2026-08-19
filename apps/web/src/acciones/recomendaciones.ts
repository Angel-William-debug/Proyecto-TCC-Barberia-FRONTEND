/** Accion de servidor del motor de recomendaciones (CU-013). */
'use server';

import { ErrorAplicacion, exigirSesion, generarRecomendaciones } from '@barber-shop/api';
import type { RecomendacionDeLista } from '@barber-shop/tipos';

export type ResultadoRecomendaciones =
  | { ok: true; recomendaciones: RecomendacionDeLista[] }
  | { ok: false; error: string };

/**
 * Genera y guarda las recomendaciones de un cliente. No usa `ejecutar()`
 * porque no es un alta de formulario: no hay campos que validar y el
 * resultado que necesita la pantalla es la lista generada, no un id.
 */
export async function generarRecomendacionesAccion(
  idCliente: number,
): Promise<ResultadoRecomendaciones> {
  await exigirSesion();

  try {
    const recomendaciones = await generarRecomendaciones(idCliente);
    return { ok: true, recomendaciones };
  } catch (causa) {
    const mensaje =
      causa instanceof ErrorAplicacion
        ? causa.message
        : 'No se pudieron generar recomendaciones. Intente nuevamente en unos instantes.';
    return { ok: false, error: mensaje };
  }
}
