/**
 * Notificaciones: lo que el sistema le mandó a los clientes y lo que está por
 * mandar (vistas 86, 87, 95 y 100 del anexo; 15/10/2026).
 *
 * Los recordatorios por correo los manda la función `recordatorios` cada diez
 * minutos (pg_cron) y los avisos push los dispara la base al confirmar,
 * cancelar o reprogramar un turno. Todo queda en `notificaciones`, pero hasta
 * ahora ninguna pantalla lo mostraba: si un correo rebotaba, nadie se
 * enteraba.
 */

import type { NotificacionDeLista, RecordatorioProgramado } from '@barber-shop/tipos';

import { MODO_DEMO } from '../demo/modo';
import { clienteServidor } from '../supabase/cliente-servidor';
import { ErrorAplicacion, traducirError } from '../errores';
import { rechazarSiEsDemo } from '../compartido/escritura';
import { coincideTexto, type FiltroTabla } from '../compartido/filtros';
import { uno } from '../compartido/relaciones';

export interface FiltroNotificaciones extends FiltroTabla {
  estados?: string[];
  tipos?: string[];
  /** Solo los fallidos o sin correo de turnos que todavía no pasaron (bandeja). */
  soloPorAtender?: boolean;
}

export async function listarNotificaciones(
  filtro: FiltroNotificaciones = {},
): Promise<NotificacionDeLista[]> {
  if (MODO_DEMO) return [];

  const supabase = await clienteServidor();

  let consulta = supabase
    .from('notificaciones')
    .select(
      `id_notificacion, id_cita, tipo, mensaje, email_destino, estado_envio, fecha_envio,
       proveedor, intentos, created_at,
       citas ( fecha_hora, estado, clientes ( nombre ) )`,
    )
    .order('created_at', { ascending: false })
    .limit(300);

  if (filtro.soloPorAtender) consulta = consulta.in('estado_envio', ['fallido', 'sin_email']);
  else if (filtro.estados?.length) consulta = consulta.in('estado_envio', filtro.estados);
  if (filtro.tipos?.length) consulta = consulta.in('tipo', filtro.tipos);
  if (filtro.desde) consulta = consulta.gte('created_at', `${filtro.desde}T00:00:00`);
  if (filtro.hasta) consulta = consulta.lte('created_at', `${filtro.hasta}T23:59:59`);

  const { data, error } = await consulta;
  if (error) throw traducirError(error);

  const ahora = Date.now();
  return (data ?? [])
    .map((f) => {
      const cita = uno<{ fecha_hora: string; estado: string; clientes: unknown }>(f.citas);
      return {
        id_notificacion: f.id_notificacion,
        id_cita: f.id_cita,
        tipo: f.tipo,
        mensaje: f.mensaje,
        email_destino: f.email_destino,
        estado_envio: f.estado_envio,
        fecha_envio: f.fecha_envio,
        proveedor: f.proveedor,
        intentos: f.intentos,
        created_at: f.created_at,
        nombre_cliente: uno<{ nombre: string }>(cita?.clientes)?.nombre ?? null,
        fecha_turno: cita?.fecha_hora ?? null,
        estado_turno: cita?.estado ?? null,
      } satisfies NotificacionDeLista;
    })
    .filter(
      (n) =>
        coincideTexto([n.nombre_cliente, n.email_destino, n.mensaje], filtro.busqueda) &&
        (!filtro.soloPorAtender || (n.fecha_turno !== null && new Date(n.fecha_turno).getTime() > ahora)),
    );
}

/**
 * Los turnos de los próximos días y cuándo sale el recordatorio de cada uno
 * (vista 100). La función lo manda en la primera pasada después de que el
 * turno entra en la ventana de `minutos_antes_recordatorio`.
 */
export async function listarRecordatoriosProgramados(dias = 7): Promise<RecordatorioProgramado[]> {
  if (MODO_DEMO) return [];

  const supabase = await clienteServidor();

  // La recepcionista no lee configuracion_sistema (RLS, solo administrador):
  // para ella se usa el valor por omision de la columna, 24 horas.
  const { data: config } = await supabase
    .from('configuracion_sistema')
    .select('minutos_antes_recordatorio')
    .eq('id_configuracion', 1)
    .maybeSingle();
  const antesMs = Number(config?.minutos_antes_recordatorio ?? 1440) * 60_000;

  const ahora = new Date();
  const hasta = new Date(ahora.getTime() + dias * 86_400_000);

  const { data, error } = await supabase
    .from('citas')
    .select(
      `id_cita, fecha_hora, clientes ( nombre, email ),
       notificaciones ( tipo, estado_envio, intentos )`,
    )
    .eq('deleted', false)
    .in('estado', ['pendiente', 'confirmado'])
    .gte('fecha_hora', ahora.toISOString())
    .lte('fecha_hora', hasta.toISOString())
    .order('fecha_hora');
  if (error) throw traducirError(error);

  return (data ?? []).map((f) => {
    const cliente = uno<{ nombre: string; email: string | null }>(f.clientes);
    const aviso = (Array.isArray(f.notificaciones) ? f.notificaciones : []).find(
      (n: { tipo: string | null }) => n.tipo === 'recordatorio',
    ) as { estado_envio: string; intentos: number } | undefined;
    return {
      id_cita: f.id_cita,
      fecha_hora: f.fecha_hora,
      nombre_cliente: cliente?.nombre ?? 'Cliente eliminado',
      email: cliente?.email ?? null,
      sale_a_partir_de: new Date(new Date(f.fecha_hora).getTime() - antesMs).toISOString(),
      estado_envio: aviso?.estado_envio ?? null,
      intentos: aviso?.intentos ?? 0,
    };
  });
}

/**
 * Vuelve a poner en cola un recordatorio que falló o que no tenía correo
 * (vista 87). La función lo toma en su próxima pasada, si el turno sigue por
 * venir. Los reintentos automáticos se cortan en `max_reintentos_notif`
 * (RN-042); este botón los reinicia.
 */
export async function reintentarNotificacion(idNotificacion: number): Promise<void> {
  rechazarSiEsDemo();
  const supabase = await clienteServidor();
  const { data, error } = await supabase
    .from('notificaciones')
    .update({ estado_envio: 'pendiente', intentos: 0 })
    .eq('id_notificacion', idNotificacion)
    .eq('tipo', 'recordatorio')
    .in('estado_envio', ['fallido', 'sin_email'])
    .select('id_notificacion');
  if (error) throw traducirError(error);
  if (!data?.length) {
    throw new ErrorAplicacion('Solo se puede reintentar un recordatorio que falló o que no tenía correo.');
  }
}
