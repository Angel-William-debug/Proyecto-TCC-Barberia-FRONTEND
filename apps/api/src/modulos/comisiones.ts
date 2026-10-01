/**
 * Comisiones de los barberos (CU-009): consulta y liquidacion.
 *
 * La lectura y la escritura van en el mismo archivo a proposito. Son dos
 * mitades de la misma operacion -se mira lo pendiente y se paga- y separarlas
 * obligaria a abrir dos archivos para entender una sola pantalla.
 */

import type { ComisionDeLista } from '@barber-shop/tipos';

import { COMISIONES_DETALLE_DEMO } from '../demo/datos-operacion';
import { MODO_DEMO } from '../demo/modo';
import { clienteServidor } from '../supabase/cliente-servidor';
import { ErrorAplicacion, traducirError } from '../errores';
import { coincideEstado, coincideTexto, entreFechas, type FiltroTabla } from '../compartido/filtros';
import { rechazarSiEsDemo } from '../compartido/escritura';
import { uno } from '../compartido/relaciones';
import { generarPdfTabla } from '../compartido/exportacion/pdf';
import { generarZip, nombreArchivoSeguro } from '../compartido/exportacion/zip';

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

/**
 * Ficha de liquidación de UN barbero (opción B/A del pedido de la profesora:
 * el documento de una persona puntual, y la pieza que se repite en lote para
 * la opción A). Filtra por nombre, igual que ya hace `listarComisiones` -no
 * hay otra forma de acotar por barbero en esa función.
 */
export async function generarFichaComisionBarberoPdf(nombreProfesional: string): Promise<Buffer> {
  const pendientes = await listarComisiones({ estados: ['pendiente'], barbero: nombreProfesional });
  if (pendientes.length === 0) {
    throw new ErrorAplicacion(`${nombreProfesional} no tiene comisiones pendientes de liquidar.`);
  }

  const GUARANIES = (n: number) => `Gs. ${Math.round(n).toLocaleString('es-PY')}`;
  const FECHA = (iso: string) => (iso ? new Date(iso).toLocaleDateString('es-PY') : '—');

  const total = pendientes.reduce((suma, c) => suma + c.monto, 0);
  const subtitulo = `${pendientes.length} comisiones pendientes · Total: ${GUARANIES(total)}`;

  return generarPdfTabla(
    `Liquidación de comisiones — ${nombreProfesional}`,
    subtitulo,
    [
      { clave: 'fecha', titulo: 'Fecha', ancho: 1 },
      { clave: 'servicio', titulo: 'Servicio', ancho: 1.6 },
      { clave: 'costo', titulo: 'Costo del servicio', ancho: 1.3 },
      { clave: 'porcentaje', titulo: '%', ancho: 0.6 },
      { clave: 'comision', titulo: 'Comisión', ancho: 1 },
    ],
    pendientes.map((c) => ({
      fecha: FECHA(c.fecha_realizacion),
      servicio: c.nombre_servicio,
      costo: GUARANIES(c.costo_cobrado),
      porcentaje: `${c.porcentaje}%`,
      comision: GUARANIES(c.monto),
    })),
  );
}

/**
 * Un `.zip` con la ficha de liquidación de cada barbero con comisiones
 * pendientes (opción A). Reusa `generarFichaComisionBarberoPdf` por barbero.
 */
export async function exportarFichasComisionesZip(): Promise<Buffer> {
  if (MODO_DEMO) {
    throw new ErrorAplicacion('El modo demostración no puede exportar: no hay datos reales que exportar.');
  }

  const pendientes = await listarComisiones({ estados: ['pendiente'] });
  const nombres = [...new Set(pendientes.map((c) => c.nombre_profesional))];
  if (nombres.length === 0) throw new ErrorAplicacion('No hay comisiones pendientes para exportar.');

  const archivos = await Promise.all(
    nombres.map(async (nombre) => ({
      nombre: `comision-${nombreArchivoSeguro(nombre)}.pdf`,
      contenido: await generarFichaComisionBarberoPdf(nombre),
    })),
  );

  return generarZip(archivos);
}

/**
 * Liquidacion de comisiones (CU-009).
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
