/** Accion de servidor de las compras (CU-016). */
'use server';

import { crearPedido, exigirSesion } from '@barber-shop/api';
import { ESTADOS_PEDIDO, type EstadoPedido } from '@barber-shop/tipos';

import { Validacion, ejecutar, lineas, numero, texto } from './base';
import type { ResultadoAccion } from './base';

/** Alta de una orden de compra (CU-016). */
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
