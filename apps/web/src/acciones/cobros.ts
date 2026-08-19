/** Accion de servidor de los cobros (CU-008). */
'use server';

import { crearCobro, exigirSesion, listarCitasPendientesDeCobro } from '@barber-shop/api';

import { Validacion, ejecutar, numero, textoOpcional } from './base';
import type { ResultadoAccion } from './base';

/**
 * Alta de un cobro (CU-008).
 *
 * `esParcial` no lo declara el usuario: se calcula aca releyendo el saldo
 * pendiente de la cita en el servidor. El que vio el formulario al abrirse
 * pudo quedar viejo si alguien mas registro un cobro sobre el mismo turno
 * mientras tanto; confiar en un valor que vino del cliente para esto
 * permitiria mandar 'pagado' con un monto que en realidad es parcial.
 */
export async function guardarCobro(datos: FormData): Promise<ResultadoAccion> {
  await exigirSesion();

  const idCita = numero(datos, 'id_cita');
  const idMetodoPago = numero(datos, 'id_metodo_pago');
  const monto = numero(datos, 'monto');

  const v = new Validacion();
  v.exigir(idCita !== null, 'id_cita', 'Elija el turno a cobrar.');
  v.exigir(idMetodoPago !== null, 'id_metodo_pago', 'Elija el método de pago.');
  v.exigir(monto !== null && monto > 0, 'monto', 'El monto debe ser mayor a cero.');
  if (v.hayErrores) return v.resultado;

  return ejecutar('/panel/cobros', async () => {
    const pendientes = await listarCitasPendientesDeCobro();
    const cita = pendientes.find((c) => c.id_cita === idCita);
    // Si la cita ya no aparece entre las pendientes -se cobro del todo entre
    // que se abrio el panel y se envio-, se deja que la base lo rechace con
    // RN-024/RN-025 en lugar de adivinar aca.
    const saldo = cita?.saldo ?? monto!;

    await crearCobro({
      idCita: idCita!,
      idMetodoPago: idMetodoPago!,
      monto: monto!,
      esParcial: monto! < saldo,
      comprobanteUrl: textoOpcional(datos, 'comprobante_url') ?? undefined,
    });
  });
}
