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
import { uno } from '../compartido/relaciones';
import { coincideEstado, coincideTexto, entreFechas, type FiltroTabla } from '../compartido/filtros';
import { actualizar, crear } from '../compartido/escritura';

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
        (!filtro.categoria || String(s.id_categoria) === filtro.categoria) &&
        // La fecha estandar de un catalogo es la de alta (seccion 9.9).
        entreFechas(s.created_at, filtro.desde, filtro.hasta),
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

// ---------------------------------------------------------------------------
// Alta y edicion (CU-003)
// ---------------------------------------------------------------------------

export interface EntradaServicio {
  nombre: string;
  idCategoria: number;
  descripcion: string | null;
  duracionMin: number;
  precioBase: number;
  estado: boolean;
}

/** El unico lugar del sistema donde se nombran las columnas de `servicios`. */
function filaServicio(e: EntradaServicio) {
  return {
    nombre: e.nombre,
    id_categoria: e.idCategoria,
    descripcion: e.descripcion,
    duracion_min: e.duracionMin,
    precio_base: e.precioBase,
    estado: e.estado,
  };
}

/** Alta de un servicio (CU-003). Devuelve su id. */
export async function crearServicio(entrada: EntradaServicio): Promise<number> {
  return crear('servicios', filaServicio(entrada));
}

/** Edicion de un servicio (CU-003). */
export async function actualizarServicio(id: number, entrada: EntradaServicio): Promise<void> {
  return actualizar('servicios', id, filaServicio(entrada));
}

// ---------------------------------------------------------------------------
// Categorias de servicio (vistas 28 y 29) y detalle del servicio (vista 32),
// 15/10/2026. Antes las categorias solo se podian crear desde la base.
// ---------------------------------------------------------------------------

export interface EntradaCategoriaServicio {
  nombre: string;
  descripcion: string | null;
}

export async function crearCategoriaServicio(entrada: EntradaCategoriaServicio): Promise<number> {
  return crear('categorias_servicio', { ...entrada, estado: true });
}

export async function actualizarCategoriaServicio(
  id: number,
  entrada: EntradaCategoriaServicio,
): Promise<void> {
  return actualizar('categorias_servicio', id, { ...entrada });
}

/** Cuanto se hizo un servicio en los ultimos dias, y quienes lo hicieron. */
export interface EstadisticaServicio {
  veces: number;
  facturado: number;
  ultimaVez: string | null;
  porBarbero: Array<{ nombre: string; veces: number }>;
}

export async function estadisticaServicio(idServicio: number, dias = 90): Promise<EstadisticaServicio> {
  if (MODO_DEMO) return { veces: 0, facturado: 0, ultimaVez: null, porBarbero: [] };
  const supabase = await clienteServidor();
  const desde = new Date(Date.now() - dias * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from('historial_servicio')
    .select('fecha_realizacion, costo_cobrado, profesionales ( nombre )')
    .eq('id_servicio', idServicio)
    .gte('fecha_realizacion', desde)
    .order('fecha_realizacion', { ascending: false });
  if (error) throw traducirError(error);

  const filas = data ?? [];
  const porBarbero = new Map<string, number>();
  for (const f of filas) {
    const nombre = uno<{ nombre: string }>(f.profesionales)?.nombre ?? '—';
    porBarbero.set(nombre, (porBarbero.get(nombre) ?? 0) + 1);
  }
  return {
    veces: filas.length,
    facturado: filas.reduce((suma, f) => suma + Number(f.costo_cobrado), 0),
    ultimaVez: filas[0]?.fecha_realizacion ?? null,
    porBarbero: [...porBarbero].map(([nombre, veces]) => ({ nombre, veces })).sort((a, b) => b.veces - a.veces),
  };
}
