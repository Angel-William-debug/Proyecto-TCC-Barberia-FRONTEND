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
import { coincideEstado, coincideTexto, entreFechas, type FiltroTabla } from '../compartido/filtros';
import { actualizar, crear } from '../compartido/escritura';

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
        (!filtro.tipo || p.tipo === filtro.tipo) &&
        // La fecha estandar de un catalogo es la de alta (seccion 9.9).
        entreFechas(p.created_at, filtro.desde, filtro.hasta),
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

// ---------------------------------------------------------------------------
// Alta y edicion (CU-004)
// ---------------------------------------------------------------------------

export interface EntradaBarbero {
  nombre: string;
  especialidad: string | null;
  tipo: string | null;
  /** Porcentaje de comision, entre 0 y 100. */
  porcentajeComision: number;
  estado: boolean;
}

/**
 * El unico lugar del sistema donde se nombra la tabla `profesionales`.
 *
 * En pantalla se lee «Barbero» (13.3 del sistema de diseno); en la base la
 * tabla se llama `profesionales`. Esa distancia se salva aca y en ningun otro
 * lado.
 */
function filaBarbero(e: EntradaBarbero) {
  return {
    nombre: e.nombre,
    especialidad: e.especialidad,
    tipo: e.tipo,
    porcentaje_com: e.porcentajeComision,
    estado: e.estado,
  };
}

/** Alta de un barbero (CU-004). Devuelve su id. */
export async function crearBarbero(entrada: EntradaBarbero): Promise<number> {
  return crear('profesionales', filaBarbero(entrada));
}

/** Edicion de un barbero (CU-004). */
export async function actualizarBarbero(id: number, entrada: EntradaBarbero): Promise<void> {
  return actualizar('profesionales', id, filaBarbero(entrada));
}
