import { nivelStock } from '@barber-shop/tipos';
import type {
  CategoriaProducto,
  CategoriaServicio,
  MetodoPago,
  Producto,
  ProductoConNivel,
  Profesional,
  Servicio,
} from '@barber-shop/tipos';

import {
  CATEGORIAS_PRODUCTO_DEMO,
  CATEGORIAS_SERVICIO_DEMO,
  CONFIGURACION_DEMO,
  METODOS_PAGO_DEMO,
  PRODUCTOS_DEMO,
  PROFESIONALES_DEMO,
  SERVICIOS_DEMO,
} from '../demo/datos';
import { MODO_DEMO } from '../demo/modo';
import { clienteServidor } from '../supabase/cliente-servidor';
import { traducirError } from '../errores';
import { coincideEstado, coincideTexto, type FiltroTabla } from './filtros';

/**
 * Catalogos: servicios, barberos, productos y metodos de pago.
 *
 * Todos comparten la misma forma -listado con filtro por estado- y todos se
 * consultan al construir un turno o un cobro, de modo que conviene tenerlos
 * juntos.
 */

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

export async function listarCategoriasProducto(): Promise<CategoriaProducto[]> {
  if (MODO_DEMO) return CATEGORIAS_PRODUCTO_DEMO;

  const supabase = await clienteServidor();

  const { data, error } = await supabase
    .from('categorias_producto')
    .select('*')
    .eq('deleted', false)
    .eq('estado', true)
    .order('nombre');

  if (error) throw traducirError(error);
  return (data ?? []) as CategoriaProducto[];
}

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

export async function listarMetodosPago(): Promise<MetodoPago[]> {
  if (MODO_DEMO) return METODOS_PAGO_DEMO;

  const supabase = await clienteServidor();

  const { data, error } = await supabase
    .from('metodos_pago')
    .select('*')
    .eq('deleted', false)
    .eq('estado', true)
    .order('id_metodo');

  if (error) throw traducirError(error);
  return (data ?? []) as MetodoPago[];
}

/**
 * Productos con su nivel de stock ya calculado.
 *
 * El nivel se deriva aqui y no en cada vista, para que el umbral de «stock
 * bajo» sea uno solo en todo el sistema.
 */
export interface FiltroProductos extends FiltroTabla {
  /** Niveles de stock elegidos: sin_stock, critico, bajo, disponible, sobrestock. */
  niveles?: string[];
}

export async function listarProductosConNivel(
  filtro: FiltroProductos = {},
): Promise<ProductoConNivel[]> {
  const filtrar = (filas: ProductoConNivel[]) =>
    filas.filter(
      (p) =>
        coincideTexto([p.nombre, p.descripcion], filtro.busqueda) &&
        coincideEstado(p.nivel, filtro.niveles),
    );

  if (MODO_DEMO) return filtrar(PRODUCTOS_DEMO);

  const supabase = await clienteServidor();

  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('deleted', false)
    .order('nombre');
  if (error) throw traducirError(error);

  // El nivel es un valor derivado, no una columna: se calcula después de traer
  // las filas y por eso se filtra aquí y no en la consulta.
  return filtrar(
    ((data ?? []) as Producto[]).map((p) => ({
      ...p,
      nivel: nivelStock(p.stock_actual, p.stock_minimo, p.stock_maximo),
    })),
  );
}

/** Configuracion general del establecimiento (CU-020). Fila unica. */
export async function obtenerConfiguracion() {
  if (MODO_DEMO) return CONFIGURACION_DEMO;

  const supabase = await clienteServidor();

  const { data, error } = await supabase
    .from('configuracion_sistema')
    .select('*')
    .eq('id_configuracion', 1)
    .maybeSingle();

  if (error) throw traducirError(error);
  return data;
}

export async function listarHorariosAtencion() {
  const supabase = await clienteServidor();

  const { data, error } = await supabase
    .from('horarios_atencion')
    .select('*')
    .eq('deleted', false)
    .order('dia_semana');

  if (error) throw traducirError(error);
  return data ?? [];
}
