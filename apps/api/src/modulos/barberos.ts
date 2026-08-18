/**
 * Barberos (CU-004).
 *
 * La tabla de la base se llama `profesionales` y en pantalla se lee «Barbero»:
 * es la seccion 13.3 del sistema de diseno. El nombre del archivo sigue a la
 * pantalla, no a la base, porque quien lo busca viene de la barra lateral.
 */

import type { Profesional } from '@barber-shop/tipos';

import { PROFESIONALES_DEMO } from '../demo/datos-catalogo';
import { MODO_DEMO } from '../demo/modo';
import { clienteServidor } from '../supabase/cliente-servidor';
import { traducirError } from '../errores';
import { coincideEstado, coincideTexto, type FiltroTabla } from '../compartido/filtros';

export interface FiltroProfesionales extends FiltroTabla {
  /** Tipo de contratación: barbero, barbero senior, especialista, externo. */
  tipo?: string;
}

/** En la interfaz se muestran como «Barberos» (seccion 13.3 del diseno). */
export async function listarProfesionales(
  filtro: FiltroProfesionales = {},
): Promise<Profesional[]> {
  const activo = (e: boolean) => (e ? 'activo' : 'inactivo');

  const filtrar = (filas: Profesional[]) =>
    filas.filter(
      (p) =>
        coincideTexto([p.nombre, p.especialidad], filtro.busqueda) &&
        coincideEstado(activo(p.estado), filtro.estados) &&
        (!filtro.tipo || p.tipo === filtro.tipo),
    );

  if (MODO_DEMO) return filtrar(PROFESIONALES_DEMO);

  const supabase = await clienteServidor();

  let consulta = supabase.from('profesionales').select('*').eq('deleted', false).order('nombre');
  if (filtro.tipo) consulta = consulta.eq('tipo', filtro.tipo);
  if (filtro.estados?.length === 1) {
    consulta = consulta.eq('estado', filtro.estados[0] === 'activo');
  }

  const { data, error } = await consulta;
  if (error) throw traducirError(error);
  return filtrar((data ?? []) as Profesional[]);
}
