'use server';

/**
 * Acciones del portal del cliente.
 *
 * Mismo molde que el resto de `acciones/`: se valida lo obligatorio y el
 * formato, se delega en `@barber-shop/api`, y se devuelve `ResultadoAccion` en
 * lugar de lanzar. Las reglas de negocio -que el horario este libre, que la
 * barberia atienda ese dia, que el turno todavia se pueda cancelar- NO se
 * repiten aca: viven en los disparadores de la base y en las politicas RLS, y
 * duplicarlas garantiza que algun dia difieran.
 */

import { headers } from 'next/headers';

import {
  ErrorAplicacion,
  actualizarMiPerfil,
  cancelarMiTurno,
  generarMisRecomendaciones,
  registrarCliente,
  reservarTurno,
} from '@barber-shop/api';

import { CORREO, ejecutar, numero, texto, textoOpcional, Validacion, type ResultadoAccion } from './base';

const PORTAL = '/mi-cuenta';

/**
 * Alta de cuenta desde el registro publico (CU-001).
 *
 * Es una accion de servidor y no una llamada desde el navegador -como era
 * antes- porque crear la ficha del cliente necesita la clave de servicio, que
 * no puede salir del servidor.
 */
export async function accionRegistrarCliente(datos: FormData): Promise<ResultadoAccion> {
  const nombre = texto(datos, 'nombre');
  const email = texto(datos, 'email');
  const telefono = texto(datos, 'telefono');
  const password = String(datos.get('password') ?? '');
  const repetir = String(datos.get('repetir') ?? '');

  const v = new Validacion();
  v.exigir(nombre.length >= 3, 'nombre', 'Escriba su nombre y apellido.');
  v.exigir(CORREO.test(email), 'email', 'Escriba un correo válido.');
  v.exigir(telefono.length >= 6, 'telefono', 'Escriba un teléfono de contacto.');
  v.exigir(password.length >= 8, 'password', 'La contraseña debe tener al menos 8 caracteres.');
  v.exigir(password === repetir, 'repetir', 'Las dos contraseñas no coinciden.');

  if (v.hayErrores) return v.resultado;

  // El enlace del correo vuelve al mismo sitio que recibio el pedido: Vercel
  // en produccion, localhost:3000 en desarrollo. Desde la app movil el pedido
  // tambien llega a Vercel (`/api/registro`), asi que el enlace abre la web.
  const cabeceras = await headers();
  const host = cabeceras.get('x-forwarded-host') ?? cabeceras.get('host');
  const protocolo = cabeceras.get('x-forwarded-proto') ?? 'https';
  const urlRetorno = `${protocolo}://${host}/cuenta-confirmada`;

  return ejecutar(PORTAL, () => registrarCliente({ nombre, email, telefono, password }, urlRetorno));
}

/**
 * Reserva de un turno.
 *
 * `fechaHora` llega tal cual la devolvio `fn_turnos_disponibles`: un instante
 * ISO con zona. No se recompone a partir de una fecha y una hora sueltas,
 * porque eso obligaria a decidir la zona horaria en el navegador y la de la
 * barberia es la que manda.
 */
export async function accionReservarTurno(datos: FormData): Promise<ResultadoAccion> {
  const fechaHora = texto(datos, 'fechaHora');
  const idProfesional = numero(datos, 'idProfesional');

  // Los servicios llegan como campos repetidos con el mismo nombre, que es
  // como el navegador envia una lista sin necesidad de JavaScript.
  const idsServicio = datos
    .getAll('idServicio')
    .map((v) => Number(String(v)))
    .filter((n) => Number.isFinite(n));

  const v = new Validacion();
  v.exigir(Boolean(fechaHora), 'fechaHora', 'Elija un horario disponible.');
  v.exigir(idsServicio.length > 0, 'idServicio', 'Elija al menos un servicio.');
  v.exigir(idProfesional != null, 'idProfesional', 'Elija con quién se quiere atender.');

  if (v.hayErrores) return v.resultado;

  return ejecutar(PORTAL, () =>
    reservarTurno({
      fechaHora,
      idsServicio,
      idProfesional: idProfesional!,
      observaciones: textoOpcional(datos, 'observaciones') ?? undefined,
    }),
  );
}

export async function accionCancelarTurno(datos: FormData): Promise<ResultadoAccion> {
  const idCita = numero(datos, 'idCita');
  if (idCita == null) {
    return { ok: false, error: 'No se identificó el turno que quiere cancelar.' };
  }

  return ejecutar(PORTAL, () => cancelarMiTurno(idCita));
}

export async function accionActualizarPerfil(datos: FormData): Promise<ResultadoAccion> {
  const nombre = texto(datos, 'nombre');
  const telefono = texto(datos, 'telefono');

  const v = new Validacion();
  v.exigir(nombre.length >= 3, 'nombre', 'Escriba su nombre y apellido.');
  v.exigir(telefono.length >= 6, 'telefono', 'Escriba un teléfono de contacto.');

  if (v.hayErrores) return v.resultado;

  return ejecutar(`${PORTAL}/perfil`, () =>
    actualizarMiPerfil({
      nombre,
      telefono,
      direccion: textoOpcional(datos, 'direccion') ?? undefined,
      fechaNacimiento: textoOpcional(datos, 'fechaNacimiento') ?? undefined,
    }),
  );
}

export type ResultadoMisRecomendaciones =
  | { ok: true; nuevas: boolean; cantidad: number }
  | { ok: false; error: string };

/**
 * El cliente pide sus recomendaciones (CU-013 desde el portal). No usa
 * `ejecutar()` porque no es un formulario: no hay campos, y lo que la
 * pantalla necesita saber es si se recalcularon o seguian vigentes.
 */
export async function accionGenerarMisRecomendaciones(): Promise<ResultadoMisRecomendaciones> {
  try {
    const r = await generarMisRecomendaciones();
    return { ok: true, nuevas: r.nuevas, cantidad: r.recomendaciones.length };
  } catch (causa) {
    return {
      ok: false,
      error:
        causa instanceof ErrorAplicacion
          ? causa.message
          : 'No se pudieron generar sus recomendaciones. Intente de nuevo en unos instantes.',
    };
  }
}
