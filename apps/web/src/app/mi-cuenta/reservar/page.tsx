import { barberosPublicos, catalogoServicios, turnosDisponibles } from '@barber-shop/api';
import { EstadoVacio, ZONA_HORARIA, fechaLarga } from '@barber-shop/ui';

import { EleccionReserva } from '@/componentes/portal/eleccion-reserva';
import { GrillaHorarios } from '@/componentes/portal/grilla-horarios';

export const metadata = {
  title: 'Reservar un turno',
};

/**
 * Reserva de un turno desde el portal.
 *
 * El servicio y la fecha viajan en la URL, asi que esta pantalla puede pedirle
 * a la base exactamente las franjas que corresponden en lugar de traerlas
 * todas y filtrar en el navegador. Ver `EleccionReserva`.
 */

/** Hoy en la zona de la barberia, como aaaa-MM-dd. */
function hoyLocal(): string {
  // `en-CA` da aaaa-MM-dd, que es el formato que espera `input type="date"`.
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_HORARIA }).format(new Date());
}

export default async function Reservar({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const leer = (clave: string) => {
    const v = params[clave];
    return Array.isArray(v) ? v[0] : v;
  };

  const catalogo = await catalogoServicios();

  // `servicio=1,3`: la misma convencion de valores multiples que usan las
  // tablas del panel. Se conserva el orden en que el cliente los fue eligiendo.
  const elegidos = (leer('servicio') ?? '')
    .split(',')
    .map((n) => Number(n))
    .filter((n) => Number.isFinite(n) && n > 0);

  const fecha = leer('fecha') ?? '';

  const servicios = elegidos
    .map((id) => catalogo.find((s) => s.id_servicio === id))
    .filter((s): s is (typeof catalogo)[number] => Boolean(s));

  const duracionTotal = servicios.reduce((n, s) => n + s.duracion_min, 0);

  // Las franjas solo se piden cuando hay al menos un servicio y una fecha: sin
  // eso no hay nada que calcular. Se pide por la duracion TOTAL, no por la de
  // cada servicio: un corte de 30 minutos entra en huecos donde un corte con
  // barba de 75 no.
  const [franjas, barberos] =
    servicios.length && fecha
      ? await Promise.all([turnosDisponibles(fecha, duracionTotal), barberosPublicos()])
      : [[], []];

  return (
    <div className="mt-2">
      <h1 className="font-display text-principal text-display-sm font-semibold">
        Reservar un turno
      </h1>
      <p className="text-cuerpo text-secundario medida-lectura mt-2">
        Elija el servicio y el día, y le mostramos los horarios que quedan libres con la
        cantidad de barberos disponibles en cada uno.
      </p>

      <div className="mt-6">
        <EleccionReserva servicios={catalogo} hoy={hoyLocal()} />
      </div>

      {!servicios.length || !fecha ? (
        <div className="border-borde-sutil bg-superficie mt-6 rounded-lg border p-2">
          <EstadoVacio
            icono="calendar-days"
            titulo="Elija al menos un servicio y un día"
            descripcion="Con eso podemos calcular qué horarios quedan libres y cuánto va a durar el turno."
          />
        </div>
      ) : franjas.length === 0 ? (
        <div className="border-borde-sutil bg-superficie mt-6 rounded-lg border p-2">
          <EstadoVacio
            icono="calendar-days"
            titulo={`No quedan horarios el ${fechaLarga(`${fecha}T12:00:00`)}`}
            // Los dos motivos posibles, porque desde afuera no se distinguen:
            // o la barberia no atiende ese dia, o el dia se lleno.
            descripcion={
              'Puede que la barbería no atienda ese día, que ya esté completo, o que ' +
              'no quede un hueco lo bastante largo para todo lo que eligió. Pruebe con ' +
              'otra fecha o con menos servicios.'
            }
          />
        </div>
      ) : (
        <GrillaHorarios franjas={franjas} barberos={barberos} servicios={servicios} />
      )}
    </div>
  );
}
