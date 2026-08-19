/** Accion de servidor de la agenda (CU-005, CU-006, CU-007, CU-011). */
'use server';

import { revalidatePath } from 'next/cache';

import {
  completarCita,
  crearCita,
  ErrorAplicacion,
  exigirSesion,
  registrarProductosUtilizados,
} from '@barber-shop/api';
import type { EntradaProductoUtilizado, SugerenciaCierre } from '@barber-shop/tipos';

import { Validacion, ejecutar, lineas, numero, texto, textoOpcional } from './base';
import type { ResultadoAccion } from './base';

/** Alta de un turno (CU-005). El solapamiento lo comprueba `crearCita`. */
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

/** Resultado de cerrar un turno: trae la sugerencia de insumos para el paso siguiente (CU-011). */
export type ResultadoCierre =
  | { ok: true; sugerencias: SugerenciaCierre[] }
  | { ok: false; error: string };

/** Cierra el turno (CU-007). Irreversible: la cita queda inmutable (RN-018). */
export async function completarCitaAccion(idCita: number): Promise<ResultadoCierre> {
  await exigirSesion();

  try {
    const sugerencias = await completarCita(idCita);
    revalidatePath('/panel/agenda');
    return { ok: true, sugerencias };
  } catch (causa) {
    const mensaje =
      causa instanceof ErrorAplicacion
        ? causa.message
        : 'No se pudo completar el turno. Intente nuevamente en unos instantes.';
    return { ok: false, error: mensaje };
  }
}

/** Confirma el consumo de insumos de un turno recien cerrado (CU-011). */
export async function registrarInsumosAccion(
  entradas: EntradaProductoUtilizado[],
): Promise<ResultadoAccion> {
  await exigirSesion();
  return ejecutar('/panel/inventario', () => registrarProductosUtilizados(entradas));
}
