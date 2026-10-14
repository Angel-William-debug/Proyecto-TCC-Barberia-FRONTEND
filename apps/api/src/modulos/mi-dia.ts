/**
 * «Mi día»: el panel del barbero (vistas 101 a 103 del anexo, 14/10/2026).
 *
 * Hasta ahora el rol profesional entraba al panel general -agenda de todos,
 * comisiones, ranking- y tenia que filtrarse a si mismo. Esta pantalla le
 * junta lo suyo: la agenda de hoy, lo que atendio en los ultimos 30 dias y sus
 * comisiones.
 *
 * No hace falta ningun permiso nuevo: las politicas RLS ya le dan lectura
 * sobre los turnos (`profesional_consulta`), sobre SU historial
 * (`profesional_ve_lo_suyo`) y sobre SUS comisiones
 * (`profesional_ve_sus_comisiones`). El filtro por su id de aca es para
 * armar la pantalla, no el control: aunque no se filtrara, la base no le
 * devolveria historial ni comisiones ajenas.
 */

import type { CitaCompleta, ComisionDeLista } from '@barber-shop/tipos';

import { uno } from '../compartido/relaciones';
import { MODO_DEMO } from '../demo/modo';
import { traducirError } from '../errores';
import { clienteServidor } from '../supabase/cliente-servidor';
import { listarAgenda } from './agenda';
import { listarComisiones } from './comisiones';

export interface ServicioRealizado {
  fecha: string;
  servicio: string;
  cliente: string;
  cobrado: number;
}

export interface MiDia {
  agendaHoy: CitaCompleta[];
  /** Los ultimos 30 dias, del mas reciente al mas viejo. */
  servicios: ServicioRealizado[];
  comisionesPendientes: ComisionDeLista[];
  totalPendiente: number;
  /** Lo liquidado en los ultimos 30 dias. */
  liquidadoMes: number;
}

const DIAS_SERVICIOS = 30;

export async function miDia(idProfesional: number, hoy: string): Promise<MiDia> {
  if (MODO_DEMO) {
    return { agendaHoy: [], servicios: [], comisionesPendientes: [], totalPendiente: 0, liquidadoMes: 0 };
  }

  const desde = new Date(Date.now() - DIAS_SERVICIOS * 86_400_000).toISOString();
  const supabase = await clienteServidor();

  const [agendaHoy, historial, comisiones] = await Promise.all([
    listarAgenda({ desde: hoy, hasta: hoy, idProfesional }),
    supabase
      .from('historial_servicio')
      .select('fecha_realizacion, costo_cobrado, servicios ( nombre ), clientes ( nombre )')
      .eq('id_profesional', idProfesional)
      .gte('fecha_realizacion', desde)
      .order('fecha_realizacion', { ascending: false })
      .limit(200),
    listarComisiones({ idProfesional }),
  ]);

  if (historial.error) throw traducirError(historial.error);

  const servicios = (historial.data ?? []).map<ServicioRealizado>((h) => ({
    fecha: h.fecha_realizacion as string,
    servicio: uno<{ nombre: string }>(h.servicios)?.nombre ?? 'Servicio eliminado',
    cliente: uno<{ nombre: string }>(h.clientes)?.nombre ?? 'Cliente eliminado',
    cobrado: Number(h.costo_cobrado ?? 0),
  }));

  // De la mas nueva a la mas vieja: `listarComisiones` las trae por id, que
  // no siempre sigue la fecha del servicio.
  const pendientes = comisiones
    .filter((c) => c.estado === 'pendiente')
    .sort((a, b) => b.fecha_realizacion.localeCompare(a.fecha_realizacion));

  return {
    agendaHoy,
    servicios,
    comisionesPendientes: pendientes,
    totalPendiente: pendientes.reduce((n, c) => n + c.monto, 0),
    liquidadoMes: comisiones
      .filter((c) => c.estado === 'liquidado' && c.fecha_realizacion >= desde.slice(0, 10))
      .reduce((n, c) => n + c.monto, 0),
  };
}
