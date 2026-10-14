'use server';

import { enviarReportePorCorreo, ErrorAplicacion, exigirSesion } from '@barber-shop/api';
import type { FiltroReporte, TipoReporte } from '@barber-shop/api';

export type ResultadoEnvioReporte = { ok: true; email: string } | { ok: false; error: string };

/**
 * Manda el PDF de un reporte al correo de quien lo pide (RN-050).
 *
 * El destinatario sale siempre de la sesion -nunca de un parametro que mande
 * el navegador- para que "al correo de la propia cuenta" sea una garantia del
 * servidor, no solo una convencion de la interfaz.
 */
export async function enviarReportePorCorreoAccion(
  tipo: TipoReporte,
  filtro: FiltroReporte = {},
): Promise<ResultadoEnvioReporte> {
  const usuario = await exigirSesion();

  try {
    await enviarReportePorCorreo(tipo, { email: usuario.email, nombre: usuario.nombre }, filtro);
    return { ok: true, email: usuario.email };
  } catch (causa) {
    const mensaje =
      causa instanceof ErrorAplicacion
        ? causa.message
        : 'No se pudo enviar el correo. Intente nuevamente en unos instantes.';
    return { ok: false, error: mensaje };
  }
}
