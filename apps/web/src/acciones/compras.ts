/** Accion de servidor de las compras (CU-017). */
'use server';

import { revalidatePath } from 'next/cache';

import {
  actualizarProveedor,
  cancelarPedido,
  crearPagoProveedor,
  crearPedido,
  crearProveedor,
  ErrorAplicacion,
  exigirSesion,
  listarPedidos,
  obtenerPedido,
  recibirPedido,
} from '@barber-shop/api';
import {
  ESTADOS_PEDIDO,
  type EstadoPedido,
  type PedidoDeLista,
  type PedidoDetalle,
} from '@barber-shop/tipos';

import {
  CORREO,
  Validacion,
  booleano,
  ejecutar,
  lineas,
  numero,
  texto,
  textoOpcional,
} from './base';
import type { ResultadoAccion } from './base';

/** Alta de una orden de compra (CU-017). */
export async function guardarOrden(datos: FormData): Promise<ResultadoAccion> {
  await exigirSesion();

  const v = new Validacion();
  const idProveedor = numero(datos, 'id_proveedor');
  const fechaPedido = texto(datos, 'fecha_pedido');
  const estadoBruto = texto(datos, 'estado');

  v.exigir(idProveedor !== null, 'id_proveedor', 'Elija el proveedor.');
  v.exigir(Boolean(fechaPedido), 'fecha_pedido', 'Indique la fecha del pedido.');
  v.exigir(
    (ESTADOS_PEDIDO as readonly string[]).includes(estadoBruto),
    'estado',
    'Elija el estado de la orden.',
  );

  const crudas = lineas(datos, 'id_producto', 'cantidad', 'precio_unitario').filter(([p]) =>
    Boolean(p),
  );

  v.exigir(crudas.length > 0, 'id_producto', 'Agregue al menos un producto.');

  const paraNumero = (s: string) => {
    const n = Number(s.replace(/\./g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : NaN;
  };

  const lineasPedido = crudas.map(([p, c, pu]) => ({
    idProducto: Number(p),
    cantidad: paraNumero(c ?? ''),
    precioUnitario: paraNumero(pu ?? ''),
  }));

  v.exigir(
    lineasPedido.every((l) => l.cantidad > 0),
    'cantidad',
    'La cantidad de cada producto debe ser mayor que cero.',
  );
  v.exigir(
    lineasPedido.every((l) => l.precioUnitario >= 0),
    'precio_unitario',
    'El precio no puede ser negativo.',
  );

  if (v.hayErrores) return v.resultado;

  return ejecutar('/panel/compras', () =>
    crearPedido({
      idProveedor: idProveedor!,
      fechaPedido,
      estado: estadoBruto as EstadoPedido,
      lineas: lineasPedido,
    }),
  );
}

/** Alta de un pago al proveedor (CU-018). La base valida RN-028 y CU-018 A1. */
export async function guardarPagoProveedor(datos: FormData): Promise<ResultadoAccion> {
  await exigirSesion();

  const idPedido = numero(datos, 'id_pedido');
  const idMetodoPago = numero(datos, 'id_metodo_pago');
  const monto = numero(datos, 'monto');

  const v = new Validacion();
  v.exigir(idPedido !== null, 'id_pedido', 'Elija la orden a pagar.');
  v.exigir(idMetodoPago !== null, 'id_metodo_pago', 'Elija el método de pago.');
  v.exigir(monto !== null && monto > 0, 'monto', 'El monto debe ser mayor a cero.');
  if (v.hayErrores) return v.resultado;

  return ejecutar('/panel/compras', () =>
    crearPagoProveedor({ idPedido: idPedido!, idMetodoPago: idMetodoPago!, monto: monto! }),
  );
}

// ---------------------------------------------------------------------------
// Proveedores — CU-016
// ---------------------------------------------------------------------------

export async function guardarProveedor(datos: FormData): Promise<ResultadoAccion> {
  const id = numero(datos, 'id_proveedor');
  const nombre = texto(datos, 'nombre');
  const email = textoOpcional(datos, 'email');

  const v = new Validacion();
  v.exigir(nombre.length >= 3, 'nombre', 'Ingrese el nombre del proveedor.');
  v.exigir(!email || CORREO.test(email), 'email', 'Ingrese un correo con el formato nombre@dominio.com');
  if (v.hayErrores) return v.resultado;

  const entrada = {
    nombre,
    email,
    telefono: textoOpcional(datos, 'telefono'),
    direccion: textoOpcional(datos, 'direccion'),
    estado: booleano(datos, 'estado'),
  };

  return ejecutar('/panel/compras', () =>
    id ? actualizarProveedor(id, entrada) : crearProveedor(entrada),
  );
}

// ---------------------------------------------------------------------------
// Detalle de la orden y su ciclo (vistas 75 y 76), y las ordenes de un
// proveedor (vista 72). Las lecturas devuelven el error como dato, igual que
// las escrituras, para que el panel lo muestre.
// ---------------------------------------------------------------------------

type Lectura<T> = { ok: true; datos: T } | { ok: false; error: string };

async function leer<T>(consulta: () => Promise<T>): Promise<Lectura<T>> {
  await exigirSesion();
  try {
    return { ok: true, datos: await consulta() };
  } catch (causa) {
    return {
      ok: false,
      error: causa instanceof ErrorAplicacion ? causa.message : 'No se pudo cargar. Intente de nuevo.',
    };
  }
}

export async function obtenerDetalleOrden(idPedido: number): Promise<Lectura<PedidoDetalle>> {
  return leer(() => obtenerPedido(idPedido));
}

export async function ordenesDelProveedor(nombre: string): Promise<Lectura<PedidoDeLista[]>> {
  return leer(() => listarPedidos({ proveedor: nombre }));
}

/** La mercaderia llego. Dispara la entrada de stock. */
export async function recibirOrden(idPedido: number): Promise<ResultadoAccion> {
  await exigirSesion();
  const r = await ejecutar('/panel/compras', () => recibirPedido(idPedido));
  if (r.ok) revalidatePath('/panel/inventario');
  return r;
}

export async function cancelarOrden(idPedido: number): Promise<ResultadoAccion> {
  await exigirSesion();
  return ejecutar('/panel/compras', () => cancelarPedido(idPedido));
}
