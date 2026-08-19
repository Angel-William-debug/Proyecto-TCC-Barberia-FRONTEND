/** Accion de servidor de las facturas (CU-025, anexo). */
'use server';

import { crearFactura, exigirSesion } from '@barber-shop/api';

import { ejecutar } from './base';
import type { ResultadoAccion } from './base';

/** Emite el comprobante de un cobro pagado. */
export async function emitirFactura(idCobro: number): Promise<ResultadoAccion> {
  await exigirSesion();
  return ejecutar('/panel/facturas', () => crearFactura(idCobro));
}
