/**
 * Facturas (CU-025, anexo): comprobante interno de venta.
 *
 * Sin integracion con SIFEN/timbrado -decision del equipo, ver CLAUDE.md-,
 * asi que no reemplaza una factura legal paraguaya. Se emite desde un cobro
 * ya marcado como pagado, copiando el detalle de servicios de la cita al
 * momento de emitir: si el turno cambiara despues, la factura ya impresa no
 * debe cambiar con el.
 */

import type { FacturaCompleta, FacturaDeLista } from '@barber-shop/tipos';

import { MODO_DEMO } from '../demo/modo';
import { clienteServidor } from '../supabase/cliente-servidor';
import { ErrorAplicacion, traducirError } from '../errores';
import { rechazarSiEsDemo } from '../compartido/escritura';
import { coincideTexto, type FiltroTabla } from '../compartido/filtros';
import { uno } from '../compartido/relaciones';
import { generarPdfFactura } from '../compartido/exportacion/pdf';
import { obtenerConfiguracion } from './configuracion';

const GUARANIES = (n: number) => `Gs. ${Math.round(n).toLocaleString('es-PY')}`;
const FECHA = (iso: string) => new Date(iso).toLocaleDateString('es-PY');

export async function listarFacturas(filtro: FiltroTabla = {}): Promise<FacturaDeLista[]> {
  if (MODO_DEMO) return [];

  const supabase = await clienteServidor();

  let consulta = supabase
    .from('facturas')
    .select('id_factura, id_cliente, id_cita, fecha_emision, total, estado, clientes ( nombre )')
    .eq('deleted', false)
    .order('fecha_emision', { ascending: false })
    .limit(200);

  if (filtro.estados?.length) consulta = consulta.in('estado', filtro.estados);
  if (filtro.desde) consulta = consulta.gte('fecha_emision', `${filtro.desde}T00:00:00`);
  if (filtro.hasta) consulta = consulta.lte('fecha_emision', `${filtro.hasta}T23:59:59`);

  const { data, error } = await consulta;
  if (error) throw traducirError(error);

  const filas: FacturaDeLista[] = (data ?? []).map((f) => ({
    id_factura: f.id_factura,
    id_cliente: f.id_cliente,
    nombre_cliente: uno<{ nombre: string }>(f.clientes)?.nombre ?? 'Cliente eliminado',
    id_cita: f.id_cita,
    fecha_emision: f.fecha_emision,
    total: f.total,
    estado: f.estado,
  }));

  return filas.filter((f) => coincideTexto([f.nombre_cliente], filtro.busqueda));
}

export async function obtenerFactura(idFactura: number): Promise<FacturaCompleta | null> {
  const supabase = await clienteServidor();

  const { data: factura, error } = await supabase
    .from('facturas')
    .select(
      'id_factura, id_cliente, id_cita, fecha_emision, subtotal, total, estado, observaciones, clientes ( nombre )',
    )
    .eq('id_factura', idFactura)
    .eq('deleted', false)
    .maybeSingle();

  if (error) throw traducirError(error);
  if (!factura) return null;

  const { data: lineas, error: errorLineas } = await supabase
    .from('detalle_factura')
    .select('descripcion, cantidad, precio_unitario, subtotal')
    .eq('id_factura', idFactura)
    .order('id_detalle_factura');

  if (errorLineas) throw traducirError(errorLineas);

  return {
    id_factura: factura.id_factura,
    id_cliente: factura.id_cliente,
    nombre_cliente: uno<{ nombre: string }>(factura.clientes)?.nombre ?? 'Cliente eliminado',
    id_cita: factura.id_cita,
    fecha_emision: factura.fecha_emision,
    subtotal: factura.subtotal,
    total: factura.total,
    estado: factura.estado,
    observaciones: factura.observaciones,
    lineas: lineas ?? [],
  };
}

/**
 * Emite la factura de un cobro pagado (CU-025).
 *
 * El detalle se arma copiando `detalle_cita`, no leyendolo en el momento de
 * imprimir: es la unica forma de que una factura ya emitida no cambie si el
 * turno se edita despues. Un cobro solo puede tener una factura vigente; se
 * comprueba aqui porque no hay una restriccion unica en la base para eso -un
 * cobro anulado y reemplazado podria necesitar una segunda factura el dia de
 * manana, y una unica lo impediria para siempre.
 */
export async function crearFactura(idCobro: number): Promise<number> {
  rechazarSiEsDemo();

  const supabase = await clienteServidor();

  const { data: existente, error: errorExistente } = await supabase
    .from('facturas')
    .select('id_factura')
    .eq('id_cobro', idCobro)
    .eq('deleted', false)
    .maybeSingle();

  if (errorExistente) throw traducirError(errorExistente);
  if (existente) {
    throw new ErrorAplicacion('Este cobro ya tiene una factura emitida.');
  }

  const { data: cobro, error: errorCobro } = await supabase
    .from('cobros_cliente')
    .select('id_cobro, id_cita, estado, citas ( id_cliente )')
    .eq('id_cobro', idCobro)
    .single();

  if (errorCobro) throw traducirError(errorCobro);

  const fila = cobro as {
    id_cobro: number;
    id_cita: number;
    estado: string;
    citas: { id_cliente: number } | { id_cliente: number }[] | null;
  };

  if (fila.estado !== 'pagado') {
    throw new ErrorAplicacion('Solo se puede facturar un cobro pagado.');
  }

  const idCliente = uno<{ id_cliente: number }>(fila.citas)?.id_cliente;
  if (!idCliente) throw new ErrorAplicacion('No se encontro el cliente de ese cobro.');

  const { data: detalle, error: errorDetalle } = await supabase
    .from('detalle_cita')
    .select('precio_unit, subtotal, servicios ( nombre )')
    .eq('id_cita', fila.id_cita);

  if (errorDetalle) throw traducirError(errorDetalle);
  if (!detalle || detalle.length === 0) {
    throw new ErrorAplicacion('El turno no tiene servicios para facturar.');
  }

  const lineas = detalle.map((d) => ({
    descripcion: uno<{ nombre: string }>(d.servicios)?.nombre ?? 'Servicio',
    cantidad: 1,
    precio_unitario: d.precio_unit,
    subtotal: d.subtotal,
  }));
  const subtotal = lineas.reduce((suma, l) => suma + l.subtotal, 0);

  const { data: factura, error: errorFactura } = await supabase
    .from('facturas')
    .insert({
      id_cliente: idCliente,
      id_cita: fila.id_cita,
      id_cobro: idCobro,
      subtotal,
      total: subtotal,
    })
    .select('id_factura')
    .single();

  if (errorFactura) throw traducirError(errorFactura);

  const idFactura = (factura as { id_factura: number }).id_factura;

  const { error: errorLineas } = await supabase
    .from('detalle_factura')
    .insert(lineas.map((l) => ({ id_factura: idFactura, ...l })));

  if (errorLineas) {
    await supabase.from('facturas').delete().eq('id_factura', idFactura);
    throw traducirError(errorLineas);
  }

  return idFactura;
}

/** El PDF del comprobante (CU-025), con los datos del establecimiento (CU-020). */
export async function generarFacturaPdf(idFactura: number): Promise<Buffer> {
  const [factura, configuracion] = await Promise.all([
    obtenerFactura(idFactura),
    obtenerConfiguracion(),
  ]);

  if (!factura) throw new ErrorAplicacion('No se encontro la factura solicitada.');

  return generarPdfFactura({
    numero: String(factura.id_factura).padStart(6, '0'),
    fechaEmision: FECHA(factura.fecha_emision),
    nombreBarberia: configuracion.nombre_barberia,
    rucBarberia: configuracion.ruc,
    nombreCliente: factura.nombre_cliente,
    observaciones: factura.observaciones,
    lineas: factura.lineas.map((l) => ({
      descripcion: l.descripcion,
      cantidad: l.cantidad,
      precioUnitario: GUARANIES(l.precio_unitario),
      subtotal: GUARANIES(l.subtotal),
    })),
    subtotal: GUARANIES(factura.subtotal),
    total: GUARANIES(factura.total),
  });
}
