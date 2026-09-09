/** Acciones de servidor del area de configuracion (CU-020). */
'use server';

import {
  actualizarConfiguracion,
  actualizarHorarios,
  actualizarMetodosPago,
  exigirSesion,
  type EntradaHorario,
} from '@barber-shop/api';

import { CORREO, Validacion, ejecutar, numero, texto, textoOpcional } from './base';
import type { ResultadoAccion } from './base';

/**
 * UNA ACCION POR PANTALLA, NO UNA POR TABLA
 *
 * Hasta el 9/9/2026 habia una sola `guardarConfiguracion` porque habia una
 * sola pantalla. Al repartirse el area en cuatro, cada una guarda lo suyo:
 * `actualizarConfiguracion` acepta un subconjunto de campos justamente para
 * que la pantalla de notificaciones no tenga que arrastrar el RUC y la
 * direccion en campos ocultos para no borrarlos.
 */

/** Datos del establecimiento: lo que sale impreso en comprobantes y reportes. */
export async function guardarDatosEstablecimiento(datos: FormData): Promise<ResultadoAccion> {
  await exigirSesion();

  const v = new Validacion();
  const nombre = texto(datos, 'nombre_barberia');
  const moneda = texto(datos, 'moneda');
  const zona = texto(datos, 'zona_horaria');
  const correo = textoOpcional(datos, 'email');

  v.exigir(nombre.length >= 2, 'nombre_barberia', 'Escriba el nombre de la barbería.');
  v.exigir(moneda.length === 3, 'moneda', 'La moneda se escribe con tres letras: PYG.');
  v.exigir(Boolean(zona), 'zona_horaria', 'Indique la zona horaria.');
  v.exigir(
    correo === null || CORREO.test(correo),
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
    }),
  );
}

/** Recordatorio de turno y reintentos de envío (RN-042). */
export async function guardarNotificaciones(datos: FormData): Promise<ResultadoAccion> {
  await exigirSesion();

  const v = new Validacion();
  const recordatorio = numero(datos, 'minutos_antes_recordatorio');
  const reintentos = numero(datos, 'max_reintentos_notif');

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

  if (v.hayErrores) return v.resultado;

  return ejecutar('/panel/configuracion/notificaciones', () =>
    actualizarConfiguracion({
      minutos_antes_recordatorio: recordatorio!,
      max_reintentos_notif: reintentos!,
    }),
  );
}

/**
 * Horario de atención, los siete días de una vez.
 *
 * POR QUE LOS CAMPOS LLEVAN EL ID EN EL NOMBRE
 *
 * La forma habitual de mandar una lista -repetir el mismo `name` y leerla con
 * `lineas()`- no sirve acá: una casilla desmarcada NO se envía, de modo que
 * `getAll('activo')` devolvería menos valores que días y la fila cuatro se
 * leería con el estado de la cinco. Con `activo_3` el desajuste no puede
 * ocurrir: la ausencia del campo ES el «cerrado» de ese día y de ningún otro.
 * Los `id_horario` sí van repetidos, porque son ocultos y siempre se envían.
 */
export async function guardarHorarios(datos: FormData): Promise<ResultadoAccion> {
  await exigirSesion();

  const v = new Validacion();
  const ids = datos.getAll('id_horario').map((x) => Number(x));
  const horarios: EntradaHorario[] = [];

  for (const id of ids) {
    const apertura = texto(datos, `apertura_${id}`);
    const cierre = texto(datos, `cierre_${id}`);

    v.exigir(Boolean(apertura), `apertura_${id}`, 'Falta la hora de apertura.');
    v.exigir(Boolean(cierre), `cierre_${id}`, 'Falta la hora de cierre.');
    // La base lo exige con un CHECK, y también en los días cerrados. Se valida
    // acá para poder decirlo con palabras en lugar de mostrar el error crudo.
    v.exigir(
      !apertura || !cierre || cierre > apertura,
      `cierre_${id}`,
      'El cierre tiene que ser posterior a la apertura.',
    );

    horarios.push({
      id_horario: id,
      hora_apertura: apertura,
      hora_cierre: cierre,
      activo: datos.get(`activo_${id}`) !== null,
    });
  }

  v.exigir(horarios.length > 0, 'general', 'No llegó ningún día para guardar.');

  if (v.hayErrores) return v.resultado;

  return ejecutar('/panel/configuracion/horarios', () => actualizarHorarios(horarios));
}

/**
 * Métodos de pago habilitados.
 *
 * Mismo criterio de nombres que el horario, y por la misma razón: son casillas.
 */
export async function guardarMetodosPago(datos: FormData): Promise<ResultadoAccion> {
  await exigirSesion();

  const metodos = datos.getAll('id_metodo').map((x) => {
    const id = Number(x);
    return { id_metodo: id, estado: datos.get(`estado_${id}`) !== null };
  });

  if (metodos.length === 0) {
    return { ok: false, error: 'No llegó ningún método de pago para guardar.' };
  }

  // Dejar el cobro sin ninguna forma de registrarse no es un ajuste, es una
  // pantalla de cobros rota: el selector de método quedaría vacío y no habría
  // manera de cerrar un turno. Se rechaza acá antes de tocar la base.
  if (metodos.every((m) => !m.estado)) {
    return {
      ok: false,
      error: 'Tiene que quedar habilitado al menos un método de pago, o no se podrá cobrar.',
    };
  }

  return ejecutar('/panel/configuracion/metodos-pago', () => actualizarMetodosPago(metodos));
}
