/** Accion de servidor de los cobros (CU-008). */
'use server';

import {
  ErrorAplicacion,
  crearCobro,
  exigirSesion,
  listarCitasPendientesDeCobro,
} from '@barber-shop/api';

import { Validacion, ejecutar, numero, textoOpcional } from './base';
import type { ResultadoAccion } from './base';

/**
 * Alta de un cobro (CU-008).
 *
 * Se cobra siempre el saldo completo del turno: la barberia no trabaja con
 * pagos en partes. El monto NO se toma del formulario sino del saldo que se
 * relee aca, en el servidor: el que vio el formulario al abrirse pudo quedar
 * viejo si alguien mas cobro el mismo turno mientras tanto, y un monto que
 * vino del navegador no es de fiar.
 */
export async function guardarCobro(datos: FormData): Promise<ResultadoAccion> {
  await exigirSesion();

  const idCita = numero(datos, 'id_cita');
  const idMetodoPago = numero(datos, 'id_metodo_pago');

  const v = new Validacion();
  v.exigir(idCita !== null, 'id_cita', 'Elija el turno a cobrar.');
  v.exigir(idMetodoPago !== null, 'id_metodo_pago', 'Elija el método de pago.');
  if (v.hayErrores) return v.resultado;

  return ejecutar('/panel/cobros', async () => {
    const pendientes = await listarCitasPendientesDeCobro();
    const cita = pendientes.find((c) => c.id_cita === idCita);
    // Si la cita ya no aparece entre las pendientes, se cobro entre que se
    // abrio el panel y se envio: no hay nada que cobrar.
    if (!cita) throw new ErrorAplicacion('Ese turno ya no tiene saldo pendiente de cobro.');

    await crearCobro({
      idCita: idCita!,
      idMetodoPago: idMetodoPago!,
      monto: Number(cita.saldo),
      esParcial: false,
      comprobanteUrl: textoOpcional(datos, 'comprobante_url') ?? undefined,
    });
  });
}
