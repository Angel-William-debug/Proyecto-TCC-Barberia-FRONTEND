/**
 * Cobros, comisiones, compras, movimientos de inventario y auditoría.
 *
 * Todas devuelven filas ya resueltas con sus nombres: la base guarda claves
 * foráneas, pero una tabla necesita mostrar «Marcos Ayala», no «2». El `join`
 * se hace en una sola consulta anidada de PostgREST para evitar el problema
 * N+1.
 *
 * Cada listado recibe el mismo tipo de filtro (`FiltroTabla` más lo propio de
 * la tabla) y lo aplica de las dos maneras: como cláusulas de PostgREST en la
 * rama real, y sobre el arreglo en memoria en modo demostración. El resultado
 * debe ser idéntico por los dos caminos.
 */

import type {
  AuditoriaDeLista,
  CobroDeLista,
  ComisionDeLista,
  HorarioAtencion,
  MovimientoDeLista,
  PedidoDeLista,
  Proveedor,
} from '@barber-shop/tipos';

import {
  AUDITORIA_DEMO,
  COBROS_DEMO,
  COMISIONES_DETALLE_DEMO,
  HORARIOS_DEMO,
  MOVIMIENTOS_DEMO,
  PEDIDOS_DEMO,
  PROVEEDORES_DEMO,
} from '../demo/datos-operacion';
import { MODO_DEMO } from '../demo/modo';
import { clienteServidor } from '../supabase/cliente-servidor';
import { traducirError } from '../errores';
import { coincideEstado, coincideTexto, entreFechas, type FiltroTabla } from './filtros';

/** Toma el primer elemento cuando PostgREST devuelve la relación como arreglo. */
function uno<T>(valor: unknown): T | null {
  return Array.isArray(valor) ? ((valor[0] as T) ?? null) : ((valor as T) ?? null);
}

// ---------------------------------------------------------------------------
// Cobros (CU-008)
// ---------------------------------------------------------------------------

export interface FiltroCobros extends FiltroTabla {
  /** Nombre del método de pago. */
  metodo?: string;
}

export async function listarCobros(filtro: FiltroCobros = {}): Promise<CobroDeLista[]> {
  if (MODO_DEMO) {
    return COBROS_DEMO.filter(
      (c) =>
        coincideTexto([c.nombre_cliente], filtro.busqueda) &&
        coincideEstado(c.estado, filtro.estados) &&
        (!filtro.metodo || c.metodo_pago === filtro.metodo) &&
        entreFechas(c.fecha_pago, filtro.desde, filtro.hasta),
    );
  }

  const supabase = await clienteServidor();

  let consulta = supabase
    .from('cobros_cliente')
    .select(
      `id_cobro, id_cita, monto, estado, fecha_pago,
       metodos_pago ( nombre ),
       citas ( clientes ( nombre ) )`,
    )
    .eq('deleted', false)
    .order('fecha_pago', { ascending: false, nullsFirst: false })
    .limit(200);

  if (filtro.estados?.length) consulta = consulta.in('estado', filtro.estados);
  if (filtro.desde) consulta = consulta.gte('fecha_pago', `${filtro.desde}T00:00:00`);
  if (filtro.hasta) consulta = consulta.lte('fecha_pago', `${filtro.hasta}T23:59:59`);

  const { data, error } = await consulta;
  if (error) throw traducirError(error);

  const filas = (data ?? []).map((f) => {
    const cita = uno<{ clientes: unknown }>(f.citas);
    const cliente = uno<{ nombre: string }>(cita?.clientes);
    const metodo = uno<{ nombre: string }>(f.metodos_pago);

    return {
      id_cobro: f.id_cobro,
      id_cita: f.id_cita,
      nombre_cliente: cliente?.nombre ?? 'Cliente eliminado',
      metodo_pago: metodo?.nombre ?? '—',
      monto: f.monto,
      estado: f.estado,
      fecha_pago: f.fecha_pago,
    } satisfies CobroDeLista;
  });

  // El nombre del cliente y el método viven en tablas anidadas; PostgREST no
  // filtra por ellos con `ilike` sin recurrir a una vista. Se resuelve aquí,
  // sobre las 200 filas ya traídas.
  return filas.filter(
    (c) =>
      coincideTexto([c.nombre_cliente], filtro.busqueda) &&
      (!filtro.metodo || c.metodo_pago === filtro.metodo),
  );
}

// ---------------------------------------------------------------------------
// Comisiones (CU-009)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Compras (módulo 6)
// ---------------------------------------------------------------------------

export async function listarProveedores(filtro: FiltroTabla = {}): Promise<Proveedor[]> {
  if (MODO_DEMO) {
    return PROVEEDORES_DEMO.filter((p) =>
      coincideTexto([p.nombre, p.email, p.telefono], filtro.busqueda),
    );
  }

  const supabase = await clienteServidor();

  let consulta = supabase
    .from('proveedores')
    .select('*')
    .eq('deleted', false)
    .eq('estado', true)
    .order('nombre');
  if (filtro.busqueda) consulta = consulta.ilike('nombre', `%${filtro.busqueda}%`);

  const { data, error } = await consulta;
  if (error) throw traducirError(error);
  return (data ?? []) as Proveedor[];
}

export interface FiltroPedidos extends FiltroTabla {
  proveedor?: string;
}

export async function listarPedidos(filtro: FiltroPedidos = {}): Promise<PedidoDeLista[]> {
  const filtrar = (filas: PedidoDeLista[]) =>
    filas.filter(
      (p) =>
        coincideTexto([p.nombre_proveedor], filtro.busqueda) &&
        coincideEstado(p.estado, filtro.estados) &&
        (!filtro.proveedor || p.nombre_proveedor === filtro.proveedor) &&
        entreFechas(p.fecha_pedido, filtro.desde, filtro.hasta),
    );

  if (MODO_DEMO) return filtrar(PEDIDOS_DEMO);

  const supabase = await clienteServidor();

  let consulta = supabase
    .from('pedidos')
    .select(
      `id_pedido, fecha_pedido, fecha_recepcion, estado, total,
       proveedores ( nombre ),
       detalle_pedido ( id_detalle_pedido )`,
    )
    .eq('deleted', false)
    .order('fecha_pedido', { ascending: false })
    .limit(200);

  if (filtro.estados?.length) consulta = consulta.in('estado', filtro.estados);
  if (filtro.desde) consulta = consulta.gte('fecha_pedido', `${filtro.desde}T00:00:00`);
  if (filtro.hasta) consulta = consulta.lte('fecha_pedido', `${filtro.hasta}T23:59:59`);

  const { data, error } = await consulta;
  if (error) throw traducirError(error);

  return filtrar(
    (data ?? []).map((f) => ({
      id_pedido: f.id_pedido,
      nombre_proveedor: uno<{ nombre: string }>(f.proveedores)?.nombre ?? '—',
      fecha_pedido: f.fecha_pedido,
      fecha_recepcion: f.fecha_recepcion,
      cantidad_items: Array.isArray(f.detalle_pedido) ? f.detalle_pedido.length : 0,
      estado: f.estado,
      total: f.total,
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
// Auditoría
// ---------------------------------------------------------------------------

export interface FiltroAuditoria extends FiltroTabla {
  /** Nombre de la tabla afectada. */
  tabla?: string;
  /** `INSERT`, `UPDATE` o `DELETE`. */
  acciones?: string[];
}

/**
 * Registro de auditoría. Solo el administrador puede leerlo: así lo fijan las
 * políticas RLS, de modo que para cualquier otro rol esta consulta devuelve
 * una lista vacía en lugar de un error.
 */
export async function listarAuditoria(
  filtro: FiltroAuditoria = {},
): Promise<AuditoriaDeLista[]> {
  const filtrar = (filas: AuditoriaDeLista[]) =>
    filas.filter(
      (r) =>
        coincideTexto([r.nombre_usuario, r.detalle, r.tabla_afectada], filtro.busqueda) &&
        coincideEstado(r.accion, filtro.acciones) &&
        (!filtro.tabla || r.tabla_afectada === filtro.tabla) &&
        entreFechas(r.fecha_accion, filtro.desde, filtro.hasta),
    );

  if (MODO_DEMO) return filtrar(AUDITORIA_DEMO);

  const supabase = await clienteServidor();

  let consulta = supabase
    .from('auditoria')
    .select('id_auditoria, tabla_afectada, accion, registro_id, detalle, fecha_accion, usuarios ( nombre )')
    .order('fecha_accion', { ascending: false })
    .limit(200);

  if (filtro.acciones?.length) consulta = consulta.in('accion', filtro.acciones);
  if (filtro.tabla) consulta = consulta.eq('tabla_afectada', filtro.tabla);
  if (filtro.desde) consulta = consulta.gte('fecha_accion', `${filtro.desde}T00:00:00`);
  if (filtro.hasta) consulta = consulta.lte('fecha_accion', `${filtro.hasta}T23:59:59`);

  const { data, error } = await consulta;
  if (error) throw traducirError(error);

  return filtrar(
    (data ?? []).map((f) => ({
      id_auditoria: f.id_auditoria,
      nombre_usuario: uno<{ nombre: string }>(f.usuarios)?.nombre ?? null,
      tabla_afectada: f.tabla_afectada,
      accion: f.accion,
      registro_id: f.registro_id,
      detalle: f.detalle,
      fecha_accion: f.fecha_accion,
    })),
  );
}

// ---------------------------------------------------------------------------
// Horarios (CU-020)
// ---------------------------------------------------------------------------

export async function listarHorarios(): Promise<HorarioAtencion[]> {
  if (MODO_DEMO) return HORARIOS_DEMO;

  const supabase = await clienteServidor();

  const { data, error } = await supabase
    .from('horarios_atencion')
    .select('*')
    .eq('deleted', false)
    .order('dia_semana');

  if (error) throw traducirError(error);
  return (data ?? []) as HorarioAtencion[];
}
