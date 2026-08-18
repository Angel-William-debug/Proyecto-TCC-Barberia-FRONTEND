'use server';

import { revalidatePath } from 'next/cache';

import {
  ErrorAplicacion,
  actualizarConfiguracion,
  crearCita,
  crearPedido,
  exigirSesion,
  liquidarComisiones,
} from '@barber-shop/api';
import { ESTADOS_PEDIDO, type EstadoPedido } from '@barber-shop/tipos';

import { Validacion, numero, texto, textoOpcional, type ResultadoAccion } from './comunes';

/**
 * Acciones de las operaciones: turno, liquidacion, orden de compra y
 * configuracion.
 *
 * Van aparte de `entidades.ts` por la misma razon por la que su capa de datos
 * va aparte: no son un alta de una fila. Un turno escribe cabecera y detalle,
 * la liquidacion toca muchas filas y la configuracion es una fila unica.
 */

async function ejecutar(
  ruta: string,
  operacion: () => Promise<number | void>,
): Promise<ResultadoAccion> {
  try {
    const id = await operacion();
    revalidatePath(ruta);
    return typeof id === 'number' ? { ok: true, id } : { ok: true };
  } catch (causa) {
    const mensaje =
      causa instanceof ErrorAplicacion
        ? causa.message
        : 'No se pudo guardar. Intente nuevamente en unos instantes.';
    return { ok: false, error: mensaje };
  }
}

/**
 * Lee las lineas repetidas de un formulario.
 *
 * El detalle de un turno o de una orden llega como campos con el mismo nombre
 * repetido -`servicio`, `servicio`, `servicio`-, que es como el navegador
 * envia una lista sin necesidad de JavaScript. `getAll` los recupera en orden,
 * de modo que la posicion N de una lista se corresponde con la N de la otra.
 */
function lineas(datos: FormData, ...claves: string[]): string[][] {
  const columnas = claves.map((c) => datos.getAll(c).map((v) => String(v).trim()));
  const largo = Math.max(0, ...columnas.map((c) => c.length));
  const filas: string[][] = [];
  for (let i = 0; i < largo; i++) filas.push(columnas.map((c) => c[i] ?? ''));
  return filas;
}

/** Alta de un turno (CU-006). El solapamiento lo comprueba `crearCita`. */
export async function guardarTurno(datos: FormData): Promise<ResultadoAccion> {
  await exigirSesion();

  const v = new Validacion();
  const idCliente = numero(datos, 'id_cliente');
  const fecha = texto(datos, 'fecha');
  const hora = texto(datos, 'hora');

  v.exigir(idCliente !== null, 'id_cliente', 'Elija el cliente.');
  v.exigir(Boolean(fecha), 'fecha', 'Indique la fecha del turno.');
  v.exigir(Boolean(hora), 'hora', 'Indique la hora del turno.');

  const servicios = lineas(datos, 'id_servicio', 'id_profesional')
    .filter(([s]) => Boolean(s))
    .map(([s, p]) => ({ idServicio: Number(s), idProfesional: Number(p) }));

  v.exigir(servicios.length > 0, 'id_servicio', 'Agregue al menos un servicio.');
  v.exigir(
    servicios.every((s) => Number.isFinite(s.idProfesional) && s.idProfesional > 0),
    'id_profesional',
    'Cada servicio necesita un barbero asignado.',
  );

  if (v.hayErrores) return v.resultado;

  // El navegador entrega fecha y hora por separado; la base guarda un solo
  // instante. Se arma sin zona horaria a proposito: la columna es `timestamp`
  // y la barberia opera en una sola zona (America/Asuncion).
  const fechaHora = `${fecha}T${hora}:00`;
  const observaciones = textoOpcional(datos, 'observaciones') ?? undefined;

  return ejecutar('/panel/agenda', () =>
    crearCita({ idCliente: idCliente!, fechaHora, observaciones, servicios }),
  );
}

/** Liquidacion de comisiones pendientes (CU-011). */
export async function liquidarPendientes(datos: FormData): Promise<ResultadoAccion> {
  await exigirSesion();

  // Sin barbero elegido se liquida todo lo pendiente. Es el caso corriente:
  // se cierra el mes y se paga a los tres.
  const idProfesional = numero(datos, 'id_profesional');

  return ejecutar('/panel/comisiones', async () => {
    const n = await liquidarComisiones(idProfesional ?? undefined);
    if (n === 0) {
      throw new ErrorAplicacion('No hay comisiones pendientes para liquidar.');
    }
  });
}

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

/** Datos del establecimiento y parametros del sistema (CU-020). */
export async function guardarConfiguracion(datos: FormData): Promise<ResultadoAccion> {
  await exigirSesion();

  const v = new Validacion();
  const nombre = texto(datos, 'nombre_barberia');
  const moneda = texto(datos, 'moneda');
  const zona = texto(datos, 'zona_horaria');
  const recordatorio = numero(datos, 'minutos_antes_recordatorio');
  const reintentos = numero(datos, 'max_reintentos_notif');
  const correo = textoOpcional(datos, 'email');

  v.exigir(nombre.length >= 2, 'nombre_barberia', 'Escriba el nombre de la barbería.');
  v.exigir(moneda.length === 3, 'moneda', 'La moneda se escribe con tres letras: PYG.');
  v.exigir(Boolean(zona), 'zona_horaria', 'Indique la zona horaria.');
  v.exigir(
    recordatorio !== null && recordatorio >= 0,
    'minutos_antes_recordatorio',
    'Indique cuántos minutos antes se avisa. Cero desactiva el recordatorio.',
  );
  v.exigir(
    reintentos !== null && reintentos >= 0,
    'max_reintentos_notif',
    'Indique cuántos reintentos se permiten.',
  );
  v.exigir(
    correo === null || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo),
    'email',
    'El correo no tiene un formato válido.',
  );

  if (v.hayErrores) return v.resultado;

  return ejecutar('/panel/configuracion', () =>
    actualizarConfiguracion({
      nombre_barberia: nombre,
      ruc: textoOpcional(datos, 'ruc'),
      direccion: textoOpcional(datos, 'direccion'),
      telefono: textoOpcional(datos, 'telefono'),
      email: correo,
      moneda: moneda.toUpperCase(),
      zona_horaria: zona,
      minutos_antes_recordatorio: recordatorio!,
      max_reintentos_notif: reintentos!,
    }),
  );
}
