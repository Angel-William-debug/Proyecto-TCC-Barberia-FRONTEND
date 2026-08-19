/**
 * Compras: proveedores (CU-016) y ordenes de compra con su detalle (CU-017).
 *
 * Una orden marcada como recibida dispara la entrada de stock: lo hace un
 * disparador de la base, no este archivo.
 */

import type {
  EstadoPedido,
  PagoProveedorDeLista,
  PedidoDeLista,
  PedidoPendientePago,
  Proveedor,
} from '@barber-shop/tipos';

import { PEDIDOS_DEMO, PROVEEDORES_DEMO } from '../demo/datos-operacion';
import { MODO_DEMO } from '../demo/modo';
import { clienteServidor } from '../supabase/cliente-servidor';
import { ErrorAplicacion, traducirError } from '../errores';
import { coincideEstado, coincideTexto, entreFechas, type FiltroTabla } from '../compartido/filtros';
import { rechazarSiEsDemo } from '../compartido/escritura';
import { uno } from '../compartido/relaciones';

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

/** Una linea del pedido. El precio se toma del formulario, no del catalogo:
 *  el proveedor puede cotizar distinto del precio de compra registrado. */
export interface LineaPedido {
  idProducto: number;
  cantidad: number;
  precioUnitario: number;
}

export interface EntradaNuevoPedido {
  idProveedor: number;
  fechaPedido: string;
  estado: EstadoPedido;
  lineas: LineaPedido[];
}

/**
 * Alta de una orden de compra (CU-017): cabecera y detalle.
 *
 * Igual que `crearCita`, si el detalle falla se borra la cabecera para no
 * dejar una orden vacia en la lista. Lo correcto seria una funcion
 * transaccional en la base; queda anotado como mejora, igual que alla.
 */
export async function crearPedido(entrada: EntradaNuevoPedido): Promise<number> {
  rechazarSiEsDemo();

  if (entrada.lineas.length === 0) {
    throw new ErrorAplicacion('La orden debe incluir al menos un producto.');
  }

  const supabase = await clienteServidor();

  const { data: pedido, error: errorPedido } = await supabase
    .from('pedidos')
    .insert({
      id_proveedor: entrada.idProveedor,
      fecha_pedido: entrada.fechaPedido,
      estado: entrada.estado,
    })
    .select('id_pedido')
    .single();

  if (errorPedido) throw traducirError(errorPedido);

  const idPedido = (pedido as { id_pedido: number }).id_pedido;

  const detalle = entrada.lineas.map((l) => ({
    id_pedido: idPedido,
    id_producto: l.idProducto,
    cantidad: l.cantidad,
    precio_unit: l.precioUnitario,
    subtotal: l.cantidad * l.precioUnitario,
  }));

  const { error: errorDetalle } = await supabase.from('detalle_pedido').insert(detalle);

  if (errorDetalle) {
    await supabase.from('pedidos').delete().eq('id_pedido', idPedido);
    throw traducirError(errorDetalle);
  }

  return idPedido;
}

// ---------------------------------------------------------------------------
// Pago al proveedor (CU-018). No hay vista SQL para el saldo pendiente, a
// diferencia de `v_cobros_pendientes`: se calcula aca sobre las ordenes
// recibidas, restando lo ya pagado (RN-028, CU-018 A1).
// ---------------------------------------------------------------------------

export async function listarPagosProveedor(filtro: FiltroTabla = {}): Promise<PagoProveedorDeLista[]> {
  if (MODO_DEMO) return [];

  const supabase = await clienteServidor();

  let consulta = supabase
    .from('pagos_proveedor')
    .select(
      `id_pago_prov, id_pedido, monto, estado, fecha_pago,
       metodos_pago ( nombre ),
       pedidos ( proveedores ( nombre ) )`,
    )
    .order('fecha_pago', { ascending: false, nullsFirst: false })
    .limit(200);

  if (filtro.estados?.length) consulta = consulta.in('estado', filtro.estados);
  if (filtro.desde) consulta = consulta.gte('fecha_pago', `${filtro.desde}T00:00:00`);
  if (filtro.hasta) consulta = consulta.lte('fecha_pago', `${filtro.hasta}T23:59:59`);

  const { data, error } = await consulta;
  if (error) throw traducirError(error);

  const filas = (data ?? []).map((f) => {
    const pedido = uno<{ proveedores: unknown }>(f.pedidos);
    const proveedor = uno<{ nombre: string }>(pedido?.proveedores);
    const metodo = uno<{ nombre: string }>(f.metodos_pago);

    return {
      id_pago_prov: f.id_pago_prov,
      id_pedido: f.id_pedido,
      nombre_proveedor: proveedor?.nombre ?? 'Proveedor eliminado',
      metodo_pago: metodo?.nombre ?? '—',
      monto: f.monto,
      fecha_pago: f.fecha_pago,
      estado: f.estado,
    } satisfies PagoProveedorDeLista;
  });

  return filas.filter((p) => coincideTexto([p.nombre_proveedor], filtro.busqueda));
}

/** Ordenes recibidas con saldo pendiente, para el selector del formulario de pago. */
export async function listarPedidosPendientesDePago(): Promise<PedidoPendientePago[]> {
  if (MODO_DEMO) return [];

  const supabase = await clienteServidor();

  const { data: pedidos, error: errorPedidos } = await supabase
    .from('pedidos')
    .select('id_pedido, fecha_pedido, total, proveedores ( nombre )')
    .eq('estado', 'recibido')
    .eq('deleted', false);

  if (errorPedidos) throw traducirError(errorPedidos);
  if (!pedidos || pedidos.length === 0) return [];

  const { data: pagos, error: errorPagos } = await supabase
    .from('pagos_proveedor')
    .select('id_pedido, monto')
    .in('id_pedido', pedidos.map((p) => p.id_pedido))
    .in('estado', ['pagado', 'pendiente']);

  if (errorPagos) throw traducirError(errorPagos);

  const pagadoPorPedido = new Map<number, number>();
  for (const pago of pagos ?? []) {
    pagadoPorPedido.set(pago.id_pedido, (pagadoPorPedido.get(pago.id_pedido) ?? 0) + pago.monto);
  }

  return pedidos
    .map((p) => {
      const pagado = pagadoPorPedido.get(p.id_pedido) ?? 0;
      return {
        id_pedido: p.id_pedido,
        nombre_proveedor: uno<{ nombre: string }>(p.proveedores)?.nombre ?? 'Proveedor eliminado',
        fecha_pedido: p.fecha_pedido,
        total: p.total,
        pagado,
        saldo: p.total - pagado,
      } satisfies PedidoPendientePago;
    })
    .filter((p) => p.saldo > 0);
}

export interface EntradaNuevoPagoProveedor {
  idPedido: number;
  idMetodoPago: number;
  monto: number;
}

/** Alta de un pago al proveedor (CU-018). La base valida RN-028 y CU-018 A1. */
export async function crearPagoProveedor(entrada: EntradaNuevoPagoProveedor): Promise<number> {
  rechazarSiEsDemo();

  const supabase = await clienteServidor();

  const { data, error } = await supabase
    .from('pagos_proveedor')
    .insert({
      id_pedido: entrada.idPedido,
      id_metodo_pago: entrada.idMetodoPago,
      monto: entrada.monto,
      estado: 'pagado',
      fecha_pago: new Date().toISOString(),
    })
    .select('id_pago_prov')
    .single();

  if (error) throw traducirError(error);
  return (data as { id_pago_prov: number }).id_pago_prov;
}
