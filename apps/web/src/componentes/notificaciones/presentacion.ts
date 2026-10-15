import type { Presentacion } from '@barber-shop/ui';

/** Cómo se muestra cada estado de envío (sección 10 del sistema de diseño). */
export const PRESENTACION_ENVIO: Record<string, Presentacion> = {
  enviado: { etiqueta: 'Enviado', tono: 'exito', icono: 'circle-check' },
  pendiente: { etiqueta: 'En cola', tono: 'info', icono: 'clock' },
  fallido: { etiqueta: 'Falló', tono: 'peligro', icono: 'circle-x' },
  sin_email: { etiqueta: 'Sin correo', tono: 'advertencia', icono: 'user-x' },
  sin_dispositivo: { etiqueta: 'Sin app', tono: 'neutro', icono: 'circle-dashed' },
};

export function presentacionEnvio(estado: string): Presentacion {
  return PRESENTACION_ENVIO[estado] ?? { etiqueta: estado, tono: 'neutro', icono: 'circle-dashed' };
}

/** Qué le avisó el sistema al cliente. */
export const ETIQUETA_TIPO: Record<string, string> = {
  recordatorio: 'Recordatorio por correo',
  confirmacion: 'Confirmación por correo',
  turno_confirmado: 'Aviso: turno confirmado',
  turno_cancelado: 'Aviso: turno cancelado',
  turno_reprogramado: 'Aviso: turno reprogramado',
};

export function etiquetaTipo(tipo: string | null): string {
  return tipo ? (ETIQUETA_TIPO[tipo] ?? tipo) : 'Sin tipo';
}

/** Solo un recordatorio que falló o no tenía correo, de un turno que viene. */
export function sePuedeReintentar(n: {
  tipo: string | null;
  estado_envio: string;
  fecha_turno: string | null;
}): boolean {
  return (
    n.tipo === 'recordatorio' &&
    (n.estado_envio === 'fallido' || n.estado_envio === 'sin_email') &&
    n.fecha_turno !== null &&
    new Date(n.fecha_turno).getTime() > Date.now()
  );
}
