/**
 * Inventario (CU-010: gestion; CU-022: consulta, incluida `alertas_stock`).
 *
 * Los dos van juntos porque son las dos tablas de la misma pantalla y se leen
 * una al lado de la otra: el nivel de un producto solo se entiende mirando los
 * movimientos que lo dejaron asi.
 *
 * El stock puede ser negativo. El CHECK que lo impedia se elimino para
 * habilitar el flujo CU-007 A1, que permite completar un servicio con stock
 * insuficiente previa confirmacion.
 */

import { nivelStock } from '@barber-shop/tipos';
import type {
  AlertaDeLista,
  CategoriaProducto,
  MovimientoDeLista,
  Producto,
  ProductoConNivel,
  RecetaLinea,
} from '@barber-shop/tipos';

import { CATEGORIAS_PRODUCTO_DEMO, PRODUCTOS_DEMO } from '../demo/datos-catalogo';
import { MOVIMIENTOS_DEMO } from '../demo/datos-operacion';
import { MODO_DEMO } from '../demo/modo';
import { clienteServidor } from '../supabase/cliente-servidor';
import { traducirError } from '../errores';
import { rechazarSiEsDemo } from '../compartido/escritura';
import { coincideEstado, coincideTexto, entreFechas, type FiltroTabla } from '../compartido/filtros';
import { uno } from '../compartido/relaciones';

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

// ---------------------------------------------------------------------------
// Movimientos de inventario
// ---------------------------------------------------------------------------

export interface FiltroMovimientos extends FiltroTabla {
  /** `entrada`, `salida` o `ajuste`. */
  tipos?: string[];
}

export async function listarMovimientos(
  filtro: FiltroMovimientos = {},
): Promise<MovimientoDeLista[]> {
  const filtrar = (filas: MovimientoDeLista[]) =>
    filas.filter(
      (m) =>
        coincideTexto([m.nombre_producto, m.motivo, m.nombre_usuario], filtro.busqueda) &&
        coincideEstado(m.tipo, filtro.tipos) &&
        entreFechas(m.fecha, filtro.desde, filtro.hasta),
    );

  if (MODO_DEMO) return filtrar(MOVIMIENTOS_DEMO);

  const supabase = await clienteServidor();

  let consulta = supabase
    .from('movimientos_inventario')
    .select('id_movimiento, tipo, cantidad, motivo, fecha, productos ( nombre ), usuarios ( nombre )')
    .order('fecha', { ascending: false })
    .limit(200);

  if (filtro.tipos?.length) consulta = consulta.in('tipo', filtro.tipos);
  if (filtro.desde) consulta = consulta.gte('fecha', `${filtro.desde}T00:00:00`);
  if (filtro.hasta) consulta = consulta.lte('fecha', `${filtro.hasta}T23:59:59`);

  const { data, error } = await consulta;
  if (error) throw traducirError(error);

  return filtrar(
    (data ?? []).map((f) => ({
      id_movimiento: f.id_movimiento,
      nombre_producto: uno<{ nombre: string }>(f.productos)?.nombre ?? '—',
      tipo: f.tipo,
      cantidad: f.cantidad,
      motivo: f.motivo,
      fecha: f.fecha,
      nombre_usuario: uno<{ nombre: string }>(f.usuarios)?.nombre ?? null,
    })),
  );
}

// ---------------------------------------------------------------------------
// Receta del servicio (CU-003): que productos y en que cantidad consume cada
// servicio. El alta y la edicion de cada linea pasan por `crear`/`actualizar`
// genericos (`servicio_producto` ya esta en `TablaEscribible`); esta funcion
// solo resuelve el nombre del producto para mostrar la lista.
// ---------------------------------------------------------------------------

export async function listarRecetaServicio(idServicio: number): Promise<RecetaLinea[]> {
  if (MODO_DEMO) return [];

  const supabase = await clienteServidor();

  const { data, error } = await supabase
    .from('servicio_producto')
    .select('id_servicio_producto, id_producto, cantidad_estandar, unidad_uso, productos ( nombre )')
    .eq('id_servicio', idServicio)
    .eq('deleted', false)
    .eq('estado', true)
    .order('id_servicio_producto');

  if (error) throw traducirError(error);

  return (data ?? []).map((f) => ({
    id_servicio_producto: f.id_servicio_producto,
    id_producto: f.id_producto,
    nombre_producto: uno<{ nombre: string }>(f.productos)?.nombre ?? '—',
    cantidad_estandar: f.cantidad_estandar,
    unidad_uso: f.unidad_uso,
  }));
}

// ---------------------------------------------------------------------------
// Alertas de stock (CU-022). `alertas_stock` la llenan solos los disparadores
// `trg_stock_after_update` (al caer al minimo) y `trg_pedido_recibido` (las
// resuelve cuando llega la reposicion); esta pantalla solo las muestra y
// permite resolver a mano las que quedaron abiertas por un ajuste manual.
// ---------------------------------------------------------------------------

export async function listarAlertas(filtro: { soloNoResueltas?: boolean } = {}): Promise<AlertaDeLista[]> {
  if (MODO_DEMO) return [];

  const supabase = await clienteServidor();

  let consulta = supabase
    .from('alertas_stock')
    .select('id_alerta, id_producto, stock_actual, stock_minimo, fecha_alerta, resuelta, productos ( nombre )')
    .order('fecha_alerta', { ascending: false })
    .limit(100);

  if (filtro.soloNoResueltas) consulta = consulta.eq('resuelta', false);

  const { data, error } = await consulta;
  if (error) throw traducirError(error);

  return (data ?? []).map((f) => ({
    id_alerta: f.id_alerta,
    id_producto: f.id_producto,
    nombre_producto: uno<{ nombre: string }>(f.productos)?.nombre ?? '—',
    stock_actual: f.stock_actual,
    stock_minimo: f.stock_minimo,
    fecha_alerta: f.fecha_alerta,
    resuelta: f.resuelta,
  }));
}

export async function marcarAlertaResuelta(idAlerta: number): Promise<void> {
  rechazarSiEsDemo();

  const supabase = await clienteServidor();

  const { error } = await supabase
    .from('alertas_stock')
    .update({ resuelta: true })
    .eq('id_alerta', idAlerta);

  if (error) throw traducirError(error);
}
