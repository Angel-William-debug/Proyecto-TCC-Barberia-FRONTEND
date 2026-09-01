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

  const servicios = await catalogoServicios();

  const idServicio = Number(leer('servicio'));
  const fecha = leer('fecha') ?? '';
  const servicio = servicios.find((s) => s.id_servicio === idServicio);

  // Las franjas solo se piden cuando hay servicio y fecha: sin los dos no hay
  // nada que calcular, y la duracion del servicio es parte del calculo -un
  // corte de 30 minutos entra en huecos donde un corte con barba de 55 no-.
  const [franjas, barberos] =
    servicio && fecha
      ? await Promise.all([
          turnosDisponibles(fecha, servicio.duracion_min),
          barberosPublicos(),
        ])
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
        <EleccionReserva servicios={servicios} hoy={hoyLocal()} />
      </div>

      {!servicio || !fecha ? (
        <div className="border-borde-sutil bg-superficie mt-6 rounded-lg border p-2">
          <EstadoVacio
            icono="calendar-days"
            titulo="Elija un servicio y un día"
            descripcion="Con esos dos datos podemos calcular qué horarios quedan libres."
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
              'Puede que la barbería no atienda ese día o que ya esté completo. ' +
              'Pruebe con otra fecha.'
            }
          />
        </div>
      ) : (
        <GrillaHorarios franjas={franjas} barberos={barberos} servicio={servicio} />
      )}
    </div>
  );
}
