/** Accion de servidor de la auditoria (vista 15). */
'use server';

import { exigirSesion, listarAuditoria } from '@barber-shop/api';
import type { AuditoriaDeLista } from '@barber-shop/tipos';

/** Todos los cambios de un registro, del mas viejo al mas nuevo. */
export async function historialDelRegistro(tabla: string, registroId: number): Promise<AuditoriaDeLista[]> {
  await exigirSesion();
  const filas = await listarAuditoria({ tabla, registroId }).catch(() => []);
  return filas.reverse();
}
