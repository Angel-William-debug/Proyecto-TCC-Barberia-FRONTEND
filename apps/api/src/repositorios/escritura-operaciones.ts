/**
 * Escrituras que NO son un alta simple de una tabla.
 *
 * `escritura.ts` cubre el caso corriente: una fila, una tabla. Estas tres no
 * entran ahi porque cada una toca mas de una fila o mas de una tabla:
 *
 *  - la configuracion es una fila unica, con `id_configuracion = 1` fijo;
 *  - la liquidacion marca MUCHAS comisiones de una vez;
 *  - el pedido escribe cabecera y detalle.
 *
 * El alta de un turno vive aparte, en `agenda.ts`, porque ademas comprueba el
 * solapamiento de horarios.
 */

import type { EstadoPedido } from '@barber-shop/tipos';

import { clienteServidor } from '../supabase/cliente-servidor';
import { ErrorAplicacion, traducirError } from '../errores';
import { rechazarSiEsDemo } from './escritura';

/** Campos editables de la configuracion. El resto los fija la instalacion. */
export interface EntradaConfiguracion {
  nombre_barberia: string;
  ruc: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  moneda: string;
  zona_horaria: string;
  minutos_antes_recordatorio: number;
  max_reintentos_notif: number;
}

/**
 * La tabla tiene una sola fila y su clave primaria es literalmente 1: un
 * CHECK de la base lo impone. Por eso esto es un `update`, nunca un `insert`.
 */
export async function actualizarConfiguracion(datos: EntradaConfiguracion): Promise<void> {
  rechazarSiEsDemo();

  const supabase = await clienteServidor();
  const { error } = await supabase
    .from('configuracion_sistema')
    .update(datos)
    .eq('id_configuracion', 1);

  if (error) throw traducirError(error);
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
 * Alta de una orden de compra (CU-016): cabecera y detalle.
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
