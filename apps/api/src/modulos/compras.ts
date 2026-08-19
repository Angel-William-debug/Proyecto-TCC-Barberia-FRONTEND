/**
 * Compras: proveedores (CU-016) y ordenes de compra con su detalle (CU-017).
 *
 * Una orden marcada como recibida dispara la entrada de stock: lo hace un
 * disparador de la base, no este archivo.
 */

import type { EstadoPedido, PedidoDeLista, Proveedor } from '@barber-shop/tipos';

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
