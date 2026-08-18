/**
 * Comisiones de los barberos (CU-011): consulta y liquidacion.
 *
 * La lectura y la escritura van en el mismo archivo a proposito. Son dos
 * mitades de la misma operacion -se mira lo pendiente y se paga- y separarlas
 * obligaria a abrir dos archivos para entender una sola pantalla.
 */

import type { ComisionDeLista } from '@barber-shop/tipos';

import { COMISIONES_DETALLE_DEMO } from '../demo/datos-operacion';
import { MODO_DEMO } from '../demo/modo';
import { clienteServidor } from '../supabase/cliente-servidor';
import { traducirError } from '../errores';
import { coincideEstado, coincideTexto, entreFechas, type FiltroTabla } from '../compartido/filtros';
import { rechazarSiEsDemo } from '../compartido/escritura';
import { uno } from '../compartido/relaciones';

export interface FiltroComisiones extends FiltroTabla {
  /** Nombre del barbero. */
  barbero?: string;
}

export async function listarComisiones(
  filtro: FiltroComisiones = {},
): Promise<ComisionDeLista[]> {
  const filtrar = (filas: ComisionDeLista[]) =>
    filas.filter(
      (c) =>
        coincideTexto([c.nombre_profesional, c.nombre_servicio], filtro.busqueda) &&
        coincideEstado(c.estado, filtro.estados) &&
        (!filtro.barbero || c.nombre_profesional === filtro.barbero) &&
        entreFechas(c.fecha_realizacion, filtro.desde, filtro.hasta),
    );

  if (MODO_DEMO) return filtrar(COMISIONES_DETALLE_DEMO);

  const supabase = await clienteServidor();

  let consulta = supabase
    .from('pagos_profesional')
    .select(
      `id_pago_prof, monto, estado,
       profesionales ( nombre, porcentaje_com ),
       historial_servicio ( fecha_realizacion, costo_cobrado, servicios ( nombre ) )`,
    )
    .order('id_pago_prof', { ascending: false })
    .limit(200);

  if (filtro.estados?.length) consulta = consulta.in('estado', filtro.estados);

  const { data, error } = await consulta;
  if (error) throw traducirError(error);

  const filas = (data ?? []).map((f) => {
    const prof = uno<{ nombre: string; porcentaje_com: number }>(f.profesionales);
    const hist = uno<{
      fecha_realizacion: string;
      costo_cobrado: number;
      servicios: unknown;
    }>(f.historial_servicio);
    const servicio = uno<{ nombre: string }>(hist?.servicios);

    return {
      id_pago_prof: f.id_pago_prof,
      nombre_profesional: prof?.nombre ?? 'Sin asignar',
      nombre_servicio: servicio?.nombre ?? '—',
      fecha_realizacion: hist?.fecha_realizacion ?? '',
      costo_cobrado: hist?.costo_cobrado ?? 0,
      porcentaje: prof?.porcentaje_com ?? 0,
      monto: f.monto,
      estado: f.estado,
    } satisfies ComisionDeLista;
  });

  return filtrar(filas);
}

/**
 * Liquidacion de comisiones (CU-011).
 *
 * Marca como pagadas las comisiones pendientes y les pone la fecha. Se puede
 * acotar a un barbero; sin barbero, liquida todas.
 *
 * La fecha la pone el servidor y no el formulario: si la eligiera el usuario
 * podria fechar una liquidacion en el pasado y descuadrar los reportes.
 */
export async function liquidarComisiones(idProfesional?: number): Promise<number> {
  rechazarSiEsDemo();

  const supabase = await clienteServidor();

  let consulta = supabase
    .from('pagos_profesional')
    .update({ estado: 'pagado', fecha_liquidacion: new Date().toISOString().slice(0, 10) })
    .eq('estado', 'pendiente');

  if (idProfesional) consulta = consulta.eq('id_profesional', idProfesional);

  const { data, error } = await consulta.select('id_pago_prof');
  if (error) throw traducirError(error);

  return (data ?? []).length;
}
