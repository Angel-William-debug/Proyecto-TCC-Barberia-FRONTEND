/** Accion de servidor de la agenda (CU-006). */
'use server';

import { crearCita, exigirSesion } from '@barber-shop/api';

import { Validacion, ejecutar, lineas, numero, texto, textoOpcional } from './base';
import type { ResultadoAccion } from './base';

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
