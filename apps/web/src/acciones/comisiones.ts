/** Accion de servidor de las comisiones (CU-009). */
'use server';

import { ErrorAplicacion, exigirSesion, liquidarComisiones } from '@barber-shop/api';

import { ejecutar, numero } from './base';
import type { ResultadoAccion } from './base';

/** Liquidacion de comisiones pendientes (CU-009). */
export async function liquidarPendientes(datos: FormData): Promise<ResultadoAccion> {
  await exigirSesion();

  // Sin barbero elegido se liquida todo lo pendiente. Es el caso corriente:
  // se cierra el mes y se paga a los tres.
  const idProfesional = numero(datos, 'id_profesional');

  return ejecutar('/panel/comisiones', async () => {
    const n = await liquidarComisiones(idProfesional ?? undefined);
    if (n === 0) {
      throw new ErrorAplicacion('No hay comisiones pendientes para liquidar.');
    }
  });
}
