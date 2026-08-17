import type {
  ResumenKpis,
  VistaComisionPendiente,
  VistaIngresoPorPeriodo,
  VistaStockCritico,
} from '@barber-shop/tipos';

import {
  COMISIONES_DEMO,
  INGRESOS_DEMO,
  KPIS_DEMO,
  STOCK_CRITICO_DEMO,
} from '../demo/datos';
import { MODO_DEMO } from '../demo/modo';
import { clienteServidor } from '../supabase/cliente-servidor';
import { traducirError } from '../errores';

/**
 * Reportes del modulo 7.
 *
 * Se apoyan en las 7 vistas SQL y en `fn_generar_resumen_kpis`, que ya viven
 * en la base. Recalcular esos agregados en TypeScript significaria traer al
 * cliente miles de filas para sumarlas, cuando PostgreSQL lo resuelve en una
 * sola consulta.
 */

export async function resumenKpis(desde: string, hasta: string): Promise<ResumenKpis> {
  if (MODO_DEMO) return { ...KPIS_DEMO, periodo_desde: desde, periodo_hasta: hasta };

  const supabase = await clienteServidor();

  const { data, error } = await supabase.rpc('fn_generar_resumen_kpis', {
    p_desde: desde,
    p_hasta: hasta,
  });

  if (error) throw traducirError(error);
  return data as ResumenKpis;
}

export async function ingresosPorPeriodo(): Promise<VistaIngresoPorPeriodo[]> {
  if (MODO_DEMO) return INGRESOS_DEMO;

  const supabase = await clienteServidor();

  const { data, error } = await supabase
    .from('v_ingresos_por_periodo')
    .select('*')
    .order('anio', { ascending: false })
    .order('mes', { ascending: false });

  if (error) throw traducirError(error);
  return (data ?? []) as VistaIngresoPorPeriodo[];
}

export async function stockCritico(): Promise<VistaStockCritico[]> {
  if (MODO_DEMO) return STOCK_CRITICO_DEMO;

  const supabase = await clienteServidor();

  const { data, error } = await supabase.from('v_stock_critico').select('*');

  if (error) throw traducirError(error);
  return (data ?? []) as VistaStockCritico[];
}

/**
 * Comisiones pendientes por barbero.
 *
 * Solo el administrador puede leer esta vista: `pagos_profesional` es una
 * tabla de su exclusividad segun las politicas RLS. Un barbero que consulte
 * su propio panel obtiene sus comisiones por otra via, filtrada por su
 * `id_profesional`.
 */
export async function comisionesPendientes(): Promise<VistaComisionPendiente[]> {
  if (MODO_DEMO) return COMISIONES_DEMO;

  const supabase = await clienteServidor();

  const { data, error } = await supabase
    .from('v_comisiones_pendientes')
    .select('*')
    .order('total_comision', { ascending: false });

  if (error) throw traducirError(error);
  return (data ?? []) as VistaComisionPendiente[];
}
