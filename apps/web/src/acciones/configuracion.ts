/** Accion de servidor de la configuracion (CU-020). */
'use server';

import { actualizarConfiguracion, exigirSesion } from '@barber-shop/api';

import { Validacion, ejecutar, numero, texto, textoOpcional } from './base';
import type { ResultadoAccion } from './base';

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
