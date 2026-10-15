/** Acciones de servidor de las notificaciones (vista 87). */
'use server';

import { exigirSesion, reintentarNotificacion } from '@barber-shop/api';

import { ejecutar } from './base';
import type { ResultadoAccion } from './base';

/** Vuelve a poner en cola un recordatorio fallido o sin correo. */
export async function reintentar(idNotificacion: number): Promise<ResultadoAccion> {
  await exigirSesion();
  return ejecutar('/panel/notificaciones', () => reintentarNotificacion(idNotificacion));
}
