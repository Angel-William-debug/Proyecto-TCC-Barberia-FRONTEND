/**
 * Catalogo de servicios (CU-003) y sus categorias.
 *
 * En la interfaz un servicio es lo que se vende: corte, barba, afeitado. La
 * duracion que se guarda aca es la que despues ocupa el turno en la agenda,
 * asi que cambiarla mueve la disponibilidad de todos los barberos.
 */

import type { CategoriaServicio, Servicio } from '@barber-shop/tipos';

import { CATEGORIAS_SERVICIO_DEMO, SERVICIOS_DEMO } from '../demo/datos-catalogo';
import { MODO_DEMO } from '../demo/modo';
import { clienteServidor } from '../supabase/cliente-servidor';
import { traducirError } from '../errores';
import { coincideEstado, coincideTexto, type FiltroTabla } from '../compartido/filtros';

export interface FiltroServicios extends FiltroTabla {
  /** Identificador de categoría, como texto porque viene de la URL. */
  categoria?: string;
}

export async function listarServicios(filtro: FiltroServicios = {}): Promise<Servicio[]> {
  const activo = (e: boolean) => (e ? 'activo' : 'inactivo');

  const filtrar = (filas: Servicio[]) =>
    filas.filter(
      (s) =>
        coincideTexto([s.nombre, s.descripcion], filtro.busqueda) &&
        coincideEstado(activo(s.estado), filtro.estados) &&
        (!filtro.categoria || String(s.id_categoria) === filtro.categoria),
    );

  if (MODO_DEMO) return filtrar(SERVICIOS_DEMO);

  const supabase = await clienteServidor();

  let consulta = supabase.from('servicios').select('*').eq('deleted', false).order('nombre');
  if (filtro.categoria) consulta = consulta.eq('id_categoria', Number(filtro.categoria));
  if (filtro.estados?.length === 1) {
    consulta = consulta.eq('estado', filtro.estados[0] === 'activo');
  }

  const { data, error } = await consulta;
  if (error) throw traducirError(error);
  return filtrar((data ?? []) as Servicio[]);
}

export async function listarCategoriasServicio(): Promise<CategoriaServicio[]> {
  if (MODO_DEMO) return CATEGORIAS_SERVICIO_DEMO;

  const supabase = await clienteServidor();

  const { data, error } = await supabase
    .from('categorias_servicio')
    .select('*')
    .eq('deleted', false)
    .eq('estado', true)
    .order('nombre');

  if (error) throw traducirError(error);
  return (data ?? []) as CategoriaServicio[];
}
